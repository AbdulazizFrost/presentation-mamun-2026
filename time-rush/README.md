# TIME RUSH

A browser-based multiplayer 3D runner for a live classroom presentation on **“Time Management for Students”**.

The projector shows two sci-fi school corridors side by side — blue for **Team A**, green for **Team B**. Students scan a QR code and join with a name; when the host presses START, the server splits everyone into two **random, balanced teams** and the race begins. Each runner runs to the next door gate in its corridor and stops; the team answers **its own English question** on their phones within one minute. The right door opens and the runner runs through; the wrong one (red ✕) sends the runner tumbling and respawning behind the gate. Teams race at their own pace.

The runner uses the model in `client/public/models/` (see [client/public/models/README.md](client/public/models/README.md)); Team B's copy is recoloured green automatically.

---

## Requirements

- Node.js **20.12+** (developed on Node 24)
- npm
- A laptop with a modern browser (WebGL) for the projector, phones with any modern browser

## Install and run (development)

```bash
npm install
npm run dev
```

`npm run dev` starts both processes:

| Process | URL | Purpose |
|---|---|---|
| Vite client | http://localhost:5173 | React UI with hot reload; proxies `/socket.io` to the server |
| Node server | http://localhost:3001 | Express + Socket.IO, authoritative game state |

### Pages

- **Host / projector:** http://localhost:5173/host — create a room, show the QR code, start/pause/resume/restart.
- **Phone:** http://localhost:5173/join?room=CODE (the QR code opens this), or http://localhost:5173 and type the code.

### Testing with several browser windows

Each browser **origin** keeps its own phone session in `localStorage`, so use different origins (or private windows) for different “players”:

- `http://localhost:5173/join?room=CODE`
- `http://127.0.0.1:5173/join?room=CODE`
- `http://<your-LAN-IP>:5173/join?room=CODE`
- private / incognito windows

Or let bots play:

```bash
npm run bots -- CODE 10          # 10 bot students join room CODE and vote randomly
```

## Tests and build

```bash
npm test            # Vitest: room logic, voting, scoring, tie-breaks, reconnection, validation, Socket.IO integration
npm run typecheck   # strict TypeScript for client and server
npm run build       # typecheck + client (dist/client) + server bundle (dist/server)
npm start           # production: one Node process serves the client and Socket.IO
```

Tests never wait for real deadlines: the game uses an injectable `Scheduler`, and tests drive time with a fake clock.

## Environment variables

Copy `.env.example` to `.env`.

| Variable | Default | Meaning |
|---|---|---|
| `SERVER_PORT` | `3001` | Server port in development (Vite proxies to it). |
| `PORT` | falls back to `SERVER_PORT` | Server port in production. Hosting platforms usually set it. |
| `CLIENT_PORT` | `5173` | Vite dev server port. |
| `PUBLIC_URL` | – | Public HTTPS address of the deployed game, e.g. `https://time-rush.example.com`. |

## How the QR code works

When the host creates a room, the server builds the join link:

- with `PUBLIC_URL` set: `PUBLIC_URL/join?room=CODE` (works from anywhere);
- without it: `http://<laptop LAN IP>:<port>/join?room=CODE`, and the host screen shows a **development warning**: only phones on the same network can open it.

The projector turns that link into a real QR code (`qrcode` package). The room code is also shown in large letters for manual entry.

## Playing in a classroom

**Same network (simplest):** run `npm run dev` (or `npm run build && npm start`) on the laptop, connect the phones to the same Wi‑Fi — or connect the laptop to a phone's hotspot. School Wi‑Fi often isolates devices; a hotspot avoids that. Windows may ask to allow Node.js through the firewall (allow on private networks).

**From anywhere:** deploy to a public HTTPS host that supports WebSockets and long-running Node processes (e.g. Render, Railway, Fly.io, a VPS):

```bash
npm install && npm run build      # build command
npm start                         # start command
```

Set `PUBLIC_URL` to the public address. One instance only: rooms are kept in memory. Test with real phones before the presentation — public multiplayer is only verified once the deployed server is reachable.

## Game rules

- Players join in the lobby with a name only. On START the server splits everyone into **two random, balanced teams**. **After the start nobody new can join** (players who lose connection can come back).
- **A race to 20 doors.** After "3, 2, 1, GO!" both runners run down their own corridor. The door gates stand still; each runner stops in front of its next gate.
- At every gate the team gets **its own question** and **60 seconds**. As soon as **every connected team member has voted**, voting closes early — teams never wait for each other.
- The team's majority answer picks the door:
  - **right door** → it opens and the runner runs through (+100 points);
  - **wrong door** → the runner crashes, falls, vanishes and reappears behind the gate (0 points, and it costs time);
  - **no votes** → same as a wrong door, 0 points.
- **Tie:** a 5-second tie-break among the tied answers; still tied → the server picks one of them at random.
- Each team gets different questions, 40 of the 44 in the bank, never repeated.
- The game ends when both teams have passed all 20 gates. **More points wins; equal points → the team that finished first wins.**
- Timing and points live in `shared/src/config.ts`; questions in `shared/src/questions/bank.ts`.

## Architecture

```text
shared/src/
  types/game.ts          game types (phases, snapshots, results)
  protocol/events.ts     typed Socket.IO events and payloads (client + server)
  protocol/validate.ts   runtime validation of untrusted payloads
  questions/bank.ts      44 questions (English), 4–5 per topic
  config.ts              timing, scoring, rate limits
server/src/
  rooms/Room.ts          one game: participants, teams, phase machine, voting, scoring, pause, reconnection
  rooms/RoomManager.ts   in-memory room storage
  game/                  scheduler (injectable clock), phase transitions, scoring, ids
  voting/                one-vote-per-participant VoteBox, majority / tie logic
  socket/                handlers, host authorization, rate limiting
client/src/
  game/                  Three.js: SceneManager, EnvironmentView, DoorView, RunnerView, RunnerAnimator, RunnerController, GameWorld
  components/host/       projector HUD, lobby, results, host controls
  components/mobile/     phone screens
  pages/                 HostPage (projector), JoinPage (phone), HomePage
  net/                   socket, room state hook, session storage
server/tests/            Vitest unit + Socket.IO integration tests
scripts/bots.ts          bot players for rehearsals
```

Key decisions:

- **Server-authoritative.** Phases, deadlines (`phaseEndsAt`), votes, tie-breaks and scores live on the server. Clients only send intents (`vote:submit`, `game:start` …) and render snapshots. Every timer carries a token, and round resolution is idempotent, so a late timer or a late vote can never score a round twice.
- **Host authorization** is checked in `Room` against the registered host socket; hidden buttons are not a security mechanism. The host can reconnect with a secret host token; if the host disconnects, the game pauses.
- **Reconnection.** Phones store a secret session token; reconnecting restores the same participant, team and active vote. Disconnected players are kept for 2 minutes.
- **No position streaming.** The projector reproduces the runner animation locally from the authoritative `round:resolved` event; the animation timings are shared config and fit inside the server's animation phase.
- **Phones never load Three.js:** the projector page is a lazily loaded chunk.

## Your own character model

Put the model and its animations in `client/public/models/` and describe them in `runner.json` — no code changes needed. Requirements, the list of Mixamo animations and an example are in [client/public/models/README.md](client/public/models/README.md). The loader (`client/src/game/runnerAssets.ts`) scales the model, handles Mixamo bone names, removes root motion, recolours materials named `Team` and plays the clips with an `AnimationMixer`.

## Replacing other parts of the 3D world

The 3D code talks to small interfaces, so models can be swapped without touching networking or voting:

1. Put the model in `client/public/models/runner.glb`.
2. Create `GltfRunnerView implements RunnerView` (`client/src/game/RunnerView.ts`): load with `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js`, and map the model's nodes to the `RunnerRig` joints (root, body, head, arms, legs).
3. If the model has its own clips, create `MixerRunnerAnimator implements RunnerAnimator` that plays `idle`, `run`, `fall`, `getUp`, `cheer` with an `AnimationMixer` instead of the procedural limbs.
4. In `RunnerController`'s constructor, construct the new view/animator instead of `PrimitiveRunnerView` / `ProceduralRunnerAnimator`.
5. The same pattern applies to `DoorView` and `EnvironmentView` (`SchoolCorridor`).

Keep model loading separate from gameplay: load assets before creating the `GameWorld`, or show the primitive version until the model is ready.

## Current limitations

- Rooms live in memory: a server restart ends all games (clients then show a clear “game no longer available” message). One server instance only — no horizontal scaling.
- Public play requires deploying to an HTTPS host; it has not been tested on a deployed server yet.
- The runner is a placeholder until a custom model is added; no sound yet.
- On weak laptops the bloom effect switches off automatically to keep the frame rate up.
- Rate limits are per socket / per IP and simple (token bucket).
