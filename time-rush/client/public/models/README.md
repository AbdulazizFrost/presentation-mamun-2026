# Custom runner model

**Current setup:** `runner.glb` is the user's character (`runner.fbx`) rigged and animated by
`tools/blender/rig_runner.py` (Idle, Run, Fall, Cheer, Sad). Rebuild it with Blender 5.x:

    blender -b --python tools/blender/rig_runner.py -- client/public/models/runner.fbx client/public/models/runner.glb [previewDir]

Put your character here. Without `runner.json` the game uses the built-in placeholder runner.

## 1. Model requirements

- Format: **GLB/GLTF** (preferred) or **FBX**.
- **Rigged** humanoid (a skeleton with bones). The easiest way: upload the model to **Mixamo** (mixamo.com) and use **Auto-Rigger**.
- Any size and units: the game scales the model to `height` (default 1.7 m) and puts the feet on the floor.
- Face the camera (+Z, the glTF default) or set `rotationY` in `runner.json`. The game shows the runner from behind.
- One model for both teams. Team B gets a copy whose **blue** texture parts are turned **green** automatically (`"teamB": { "hueFrom": [170, 265], "hueTo": 130 }` in `runner.json`; `"teamB": false` to switch it off). Alternatively name a material **`Team`** — it is coloured blue for Team A and green for Team B.
- **No skeleton?** The game still works: a model without animations is animated as a whole (bobbing while running, falling backwards, jumping for joy). For real running legs, rig it on Mixamo (below).
- Keep it light: ideally < 20k triangles and < 5 MB.

## 2. Animations (Mixamo)

On Mixamo, with your rigged character selected, search and download these (Format **FBX**, Skin **Without Skin**, 30 fps). For **Running**, tick **In Place**.

| Role in the game | `runner.json` key | Mixamo animation (search name) |
|---|---|---|
| Waiting in the lobby | `idle` | **Breathing Idle** (or *Happy Idle*) |
| Running to the doors | `run` | **Running** or **Fast Run** — tick *In Place* |
| Hitting a wrong door | `fall` | **Stumble Backwards** (or *Falling Back Death*) |
| Getting up again | `getUp` | **Getting Up** (or *Stand Up*) |
| Winning team at the end | `cheer` | **Victory** (or *Cheering*) |
| Losing team at the end | `sad` | **Defeated** (or *Sad Idle*) |

Download your rigged character once more **With Skin** (that is the model file).

## 3. runner.json

Copy `runner.example.json` to `runner.json` and adjust the file names:

```json
{
  "model": "runner.fbx",
  "animations": {
    "idle": "animations/idle.fbx",
    "run": "animations/run.fbx",
    "fall": "animations/fall.fbx",
    "getUp": "animations/getup.fbx",
    "cheer": "animations/victory.fbx",
    "sad": "animations/defeat.fbx"
  },
  "height": 1.7,
  "rotationY": 180
}
```

- Animations can also be **inside** the model file: then give the clip names instead of file names, or leave `animations` out and the game finds clips by name (idle, run, fall, …).
- Missing animations fall back to `idle`.
- Mixamo bone names (`mixamorig:Hips` …) are handled automatically, also after exporting through Blender.
- If the runner looks at the camera, change `rotationY` to `0`.

Reload the projector page: the browser console prints `Custom runner model loaded.`
