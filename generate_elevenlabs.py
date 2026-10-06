import os
import sys
import json
import urllib.request
import argparse

WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(WORKSPACE_DIR, "assets", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# 13 items for the Fact or Myth quiz with natural human phrasing
# Corrected quiz texts. Files with the "_v2" suffix are the ones index.html now plays;
# q1/a1 are unchanged and keep their existing recordings.
ITEMS = [
    ("a2_cor_v2.mp3", "To'g'ri! Barakalla! Bu yolg'on. Xabarnomalar diqqatni oshirmaydi, balki chalg'itadi. Tadqiqotlarga ko'ra, chalg'igandan keyin ishga to'liq qaytish uchun taxminan yigirma uch daqiqa kerak bo'ladi."),
    ("a2_wrg_v2.mp3", "Afsuski noto'g'ri! Aslida bu yolg'on. Xabarnomalar diqqatni oshirmaydi, balki chalg'itadi. Tadqiqotlarga ko'ra, chalg'igandan keyin ishga to'liq qaytish uchun taxminan yigirma uch daqiqa kerak bo'ladi."),

    ("q3_v2.mp3", "Uchinchi savol. Birinchi ijtimoiy tarmoqlar faqat ikki ming o'ninchi yillarda paydo bo'lgan. Bu rostmi yoki yolg'on?"),
    ("a3_cor_v2.mp3", "To'g'ri! Barakalla! Bu yolg'on. Birinchi ijtimoiy tarmoqlardan biri, SixDegrees, bir ming to'qqiz yuz to'qson yettinchi yilda ishga tushgan. Facebook ikki ming to'rtinchi yilda, YouTube esa ikki ming beshinchi yilda paydo bo'lgan."),
    ("a3_wrg_v2.mp3", "Afsuski noto'g'ri! Aslida bu yolg'on. Birinchi ijtimoiy tarmoqlardan biri, SixDegrees, bir ming to'qqiz yuz to'qson yettinchi yilda ishga tushgan. Facebook ikki ming to'rtinchi yilda, YouTube esa ikki ming beshinchi yilda paydo bo'lgan."),

    ("q4_v2.mp3", "To'rtinchi savol. Telefon stol ustida turishining o'zi, hatto ovozsiz bo'lsa ham, diqqatni jamlashni qiyinlashtirishi mumkin. Bu rostmi yoki yolg'on?"),
    ("a4_cor_v2.mp3", "To'g'ri! Barakalla! Bu rost. Texas universiteti tadqiqotida telefoni boshqa xonada bo'lgan talabalar diqqat va xotira testlarini yaxshiroq bajargan."),
    ("a4_wrg_v2.mp3", "Afsuski noto'g'ri! Aslida bu rost. Texas universiteti tadqiqotida telefoni boshqa xonada bo'lgan talabalar diqqat va xotira testlarini yaxshiroq bajargan."),

    ("finish_v2.mp3", "Ajoyib natija! Viktorina yakunlandi. Ma'mun Universiteti talabalari bugun o'z bilimini ko'rsatishdi. Barchangizga e'tibor uchun katta rahmat!")
]

def generate_with_elevenlabs(api_key, voice_id="pNInz6obpgDQGcFmaJgB"):
    # Default voice: Adam (clear, professional narrator)
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }

    print(f"Starting ElevenLabs generation with voice ID: {voice_id}...")
    for filename, text in ITEMS:
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.55,
                "similarity_boost": 0.80,
                "style": 0.15,
                "use_speaker_boost": True
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        try:
            with urllib.request.urlopen(req) as response:
                if response.status == 200:
                    audio_bytes = response.read()
                    out_path = os.path.join(AUDIO_DIR, filename)
                    with open(out_path, "wb") as f:
                        f.write(audio_bytes)
                    print(f"  [OK] Saved {filename} ({len(audio_bytes)} bytes)")
                else:
                    print(f"  [ERROR] {filename} returned status {response.status}")
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8', errors='ignore')
            print(f"  [HTTPError] {filename}: {e.code} - {err_msg}")
            return False
        except Exception as e:
            print(f"  [Exception] {filename}: {e}")
            return False

    print("\nAll ElevenLabs audio files generated successfully!")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate natural Uzbek audio using ElevenLabs Multilingual v2")
    parser.add_argument("--api-key", default=os.getenv("ELEVENLABS_API_KEY"), help="ElevenLabs API Key")
    parser.add_argument("--voice-id", default="pNInz6obpgDQGcFmaJgB", help="ElevenLabs Voice ID (default: Adam)")
    args = parser.parse_args()

    if not args.api_key:
        print("ERROR: ElevenLabs API key is required.")
        print("Usage: python generate_elevenlabs.py --api-key <YOUR_API_KEY>")
        print("Or set the ELEVENLABS_API_KEY environment variable.")
        sys.exit(1)

    success = generate_with_elevenlabs(args.api_key, args.voice_id)
    if success:
        print("\nRe-bundling presentation artifact...")
        import subprocess
        subprocess.run([sys.executable, os.path.join(WORKSPACE_DIR, "bundle_artifact.py")])
