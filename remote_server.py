"""
Presentation server with phone remote control (Python standard library only).

    python remote_server.py            # or double-click start.bat

1. Opens the presentation at http://localhost:8000 on this laptop.
2. Click "📱 Remote" in the header and scan the QR code with a phone that is on
   the same Wi-Fi (or connect the laptop to the phone's hotspot).
3. The phone can switch slides, read the speech notes and run the quiz.

Only the laptop itself can open the presentation channel; phones must know the
6-digit PIN that is printed below and embedded in the QR code.
"""
import json
import os
import queue
import secrets
import socket
import sys
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

PORT = int(os.environ.get("PORT", "8000"))
ROOT = os.path.dirname(os.path.abspath(__file__))
PIN = f"{secrets.randbelow(10**6):06d}"

state_lock = threading.Lock()
last_state = {}            # latest state published by the presentation
deck_clients = []          # queues of open presentation tabs (receive commands)
remote_clients = []        # queues of connected phones (receive state)


def lan_addresses():
    """Best-effort list of this machine's LAN IPv4 addresses."""
    found = []
    try:
        # No packet is sent: connect() on UDP only picks the outgoing interface
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))
            found.append(s.getsockname()[0])
    except OSError:
        pass
    try:
        for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
            if ip not in found:
                found.append(ip)
    except OSError:
        pass
    return [ip for ip in found if not ip.startswith("127.")] or ["127.0.0.1"]


def broadcast(clients, payload):
    data = json.dumps(payload, ensure_ascii=False)
    with state_lock:
        for q in list(clients):
            q.put(data)


def remotes_changed():
    with state_lock:
        count = len(remote_clients)
    broadcast(deck_clients, {"type": "remotes", "count": count})


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        # Keep the console readable: only log API calls that fail
        pass

    # --- helpers -----------------------------------------------------------
    def is_local(self):
        return self.client_address[0] in ("127.0.0.1", "::1")

    def query(self):
        return {k: v[0] for k, v in parse_qs(urlparse(self.path).query).items()}

    def pin_ok(self):
        return self.is_local() or self.query().get("k") == PIN

    def send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > 64_000:
            return None
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return None

    def stream(self, clients, first=None, on_change=None):
        """Server-Sent Events: keep the connection open and push queued messages."""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        q = queue.Queue()
        with state_lock:
            clients.append(q)
        if on_change:
            on_change()
        try:
            if first is not None:
                self.wfile.write(f"data: {json.dumps(first, ensure_ascii=False)}\n\n".encode("utf-8"))
                self.wfile.flush()
            while True:
                try:
                    msg = q.get(timeout=15)
                    self.wfile.write(f"data: {msg}\n\n".encode("utf-8"))
                except queue.Empty:
                    self.wfile.write(b": ping\n\n")  # keeps phones and proxies from closing the stream
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            pass
        finally:
            with state_lock:
                if q in clients:
                    clients.remove(q)
            if on_change:
                on_change()

    # --- routes ------------------------------------------------------------
    def do_GET(self):
        path = urlparse(self.path).path
        # Never expose .git, .claude and other hidden files to the Wi-Fi network
        if any(part.startswith(".") for part in unquote(path).replace("\\", "/").split("/") if part):
            return self.send_json({"error": "not found"}, 404)
        if path == "/remote":
            self.path = "/remote.html"
            return super().do_GET()
        if path == "/api/info":
            if not self.is_local():
                return self.send_json({"error": "forbidden"}, 403)
            urls = [f"http://{ip}:{PORT}/remote?k={PIN}" for ip in lan_addresses()]
            return self.send_json({"pin": PIN, "urls": urls})
        if path == "/api/deck-events":
            if not self.is_local():
                return self.send_json({"error": "forbidden"}, 403)
            return self.stream(deck_clients)
        if path == "/api/remote-events":
            if not self.pin_ok():
                return self.send_json({"error": "bad pin"}, 403)
            with state_lock:
                snapshot = dict(last_state)
            return self.stream(remote_clients, first={"type": "state", "state": snapshot}, on_change=remotes_changed)
        if path.startswith("/api/"):
            return self.send_json({"error": "not found"}, 404)
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        body = self.read_json()
        if body is None:
            return self.send_json({"error": "bad json"}, 400)
        if path == "/api/state":
            if not self.is_local():
                return self.send_json({"error": "forbidden"}, 403)
            with state_lock:
                last_state.clear()
                last_state.update(body)
            broadcast(remote_clients, {"type": "state", "state": body})
            return self.send_json({"ok": True})
        if path == "/api/cmd":
            if not self.pin_ok():
                return self.send_json({"error": "bad pin"}, 403)
            with state_lock:
                decks = len(deck_clients)
            if not decks:
                return self.send_json({"ok": False, "error": "presentation is not open"}, 409)
            broadcast(deck_clients, {"type": "cmd", "cmd": body})
            return self.send_json({"ok": True})
        return self.send_json({"error": "not found"}, 404)


def main():
    try:
        server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    except OSError as e:
        print(f"Port {PORT} is busy ({e}). Close the other server or run: set PORT=8001 && python remote_server.py")
        sys.exit(1)
    server.daemon_threads = True

    print("=" * 60)
    print("  Time Management for Students — presentation server")
    print("=" * 60)
    print(f"  Laptop:  http://localhost:{PORT}")
    for ip in lan_addresses():
        print(f"  Phone:   http://{ip}:{PORT}/remote?k={PIN}")
    print(f"  PIN:     {PIN}")
    print("  Phone and laptop must be on the same Wi-Fi (or use the phone's hotspot).")
    print("  If Windows asks about the firewall, allow access on Private networks.")
    print("  Press Ctrl+C to stop.")
    print("=" * 60)

    if "--no-browser" not in sys.argv:
        threading.Timer(0.8, lambda: webbrowser.open(f"http://localhost:{PORT}/")).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
