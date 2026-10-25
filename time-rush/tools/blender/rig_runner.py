"""
Rigs the TIME RUSH character, animates it and exports a GLB for the game.

    blender -b --python tools/blender/rig_runner.py -- <in.fbx> <out.glb> [previewDir]

1. Imports the mesh and builds a humanoid skeleton at the joint positions measured on this
   character (JOINTS; re-measure if the model changes).
2. Binds the mesh with automatic (bone heat) weights; the head and the backpack are made rigid.
3. Animates Idle, Run, Fall, Cheer and Sad procedurally: every frame is computed from smooth
   curves (periodic splines, sines, two-bone leg IK for planted feet) and keyed.
4. Exports runner.glb (mesh, skeleton, clips, JPEG textures). With previewDir it also renders
   frames of every clip from the front, the side and from behind.
"""
import math
import os
import sys

import bpy
from mathutils import Quaternion, Vector

args = sys.argv[sys.argv.index("--") + 1 :]
IN_PATH, OUT_PATH = args[0], args[1]
PREVIEW_DIR = args[2] if len(args) > 2 else None
FPS = 30
SIDES = (("L", 1), ("R", -1))

# ---------------------------------------------------------------- import
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
bpy.ops.import_scene.fbx(filepath=IN_PATH)
mesh = next(o for o in scene.objects if o.type == "MESH")
mesh.name = "Runner"
bpy.context.view_layer.objects.active = mesh
mesh.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
ZMIN = min(v.co.z for v in mesh.data.vertices)
H = max(v.co.z for v in mesh.data.vertices) - ZMIN

# ---------------------------------------------------------------- skeleton
# Joint positions as fractions of the height, measured on this character (front/side renders and
# per-height slices of the mesh). It faces -Y, its left side is +X and z = 0 is the floor.
JOINTS = {
    "hips": (0.0, -0.010, 0.370),
    "spine": (0.0, -0.020, 0.430),
    "chest": (0.0, -0.025, 0.530),
    "neck": (0.0, -0.005, 0.665),
    "head": (0.0, 0.000, 0.705),
    "head_end": (0.0, 0.000, 1.000),
    "clavicle": (0.020, -0.010, 0.645),
    "shoulder": (0.115, -0.005, 0.600),
    "elbow": (0.170, -0.010, 0.505),
    "wrist": (0.196, -0.025, 0.418),
    "hand_end": (0.204, -0.030, 0.340),
    "hip": (0.062, -0.010, 0.345),
    "knee": (0.080, -0.005, 0.205),
    "ankle": (0.095, 0.000, 0.078),
    "toe": (0.110, -0.120, 0.025),
}


def joint(name, side=1):
    x, y, z = JOINTS[name]
    return Vector((x * side * H, y * H, ZMIN + z * H))


bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
rig = bpy.context.object
rig.name = rig.data.name = "RunnerRig"
edit_bones = rig.data.edit_bones
edit_bones.remove(edit_bones[0])


def bone(name, head, tail, parent=None):
    b = edit_bones.new(name)
    b.head, b.tail, b.roll = head, tail, 0.0
    if parent:
        b.parent = edit_bones[parent]
        b.use_connect = (b.parent.tail - b.head).length < 1e-6


bone("Hips", joint("hips"), joint("spine"))
bone("Spine", joint("spine"), joint("chest"), "Hips")
bone("Chest", joint("chest"), joint("neck"), "Spine")
bone("Neck", joint("neck"), joint("head"), "Chest")
bone("Head", joint("head"), joint("head_end"), "Neck")
for s, k in SIDES:
    bone(f"Shoulder.{s}", joint("clavicle", k), joint("shoulder", k), "Chest")
    bone(f"UpperArm.{s}", joint("shoulder", k), joint("elbow", k), f"Shoulder.{s}")
    bone(f"LowerArm.{s}", joint("elbow", k), joint("wrist", k), f"UpperArm.{s}")
    bone(f"Hand.{s}", joint("wrist", k), joint("hand_end", k), f"LowerArm.{s}")
    bone(f"UpperLeg.{s}", joint("hip", k), joint("knee", k), "Hips")
    bone(f"LowerLeg.{s}", joint("knee", k), joint("ankle", k), f"UpperLeg.{s}")
    bone(f"Foot.{s}", joint("ankle", k), joint("toe", k), f"LowerLeg.{s}")
bpy.ops.object.mode_set(mode="OBJECT")

# ---------------------------------------------------------------- skinning
bpy.ops.object.select_all(action="DESELECT")
mesh.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type="ARMATURE_AUTO")
unweighted = sum(1 for v in mesh.data.vertices if not any(g.weight > 0.001 for g in v.groups))
print(f"[rig] vertices without weights after bone heat: {unweighted}/{len(mesh.data.vertices)}")
if unweighted > len(mesh.data.vertices) * 0.02:
    raise SystemExit("[rig] bone heat failed; check the joint positions")


def smoothstep(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def make_rigid(target):
    """Blends every vertex's weights toward target(x, y, z) -> (amount, {bone: weight}); coordinates in H."""
    groups = mesh.vertex_groups
    names = {g.index: g.name for g in groups}
    for v in mesh.data.vertices:
        amount, weights = target(v.co.x / H, v.co.y / H, (v.co.z - ZMIN) / H)
        if amount <= 0:
            continue
        current = {names[g.group]: g.weight for g in v.groups}
        total = sum(current.values()) or 1.0
        mixed = {n: w / total * (1 - amount) for n, w in current.items()}
        for n, w in weights.items():
            mixed[n] = mixed.get(n, 0.0) + w * amount
        for n, w in mixed.items():
            if n not in groups:
                groups.new(name=n)
            groups[n].add([v.index], w, "REPLACE")


# The head (with the hair) moves as one piece; so does the backpack.
make_rigid(lambda x, y, z: (smoothstep(0.700, 0.725, z), {"Head": 1.0}))
make_rigid(lambda x, y, z: (
    smoothstep(0.04, 0.07, y) * smoothstep(0.40, 0.43, z) * (1 - smoothstep(0.64, 0.68, z)),
    {"Chest": smoothstep(0.45, 0.56, z), "Spine": 1 - smoothstep(0.45, 0.56, z)},
))

# ---------------------------------------------------------------- posing
REST = {b.name: b.matrix_local.to_quaternion() for b in rig.data.bones}
REST_DIR = {b.name: (b.tail_local - b.head_local).normalized() for b in rig.data.bones}
for pb in rig.pose.bones:
    pb.rotation_mode = "QUATERNION"

TRUNK = ("hips", "spine", "chest", "neck", "head")
LIMB = ("clav_up", "clav_fwd", "arm_flex", "arm_abd", "arm_twist", "elbow", "wrist",
        "hip_flex", "hip_abd", "hip_twist", "knee", "ankle")
PARAMS = (["hips_x", "hips_y", "hips_z"] + [f"{b}_{a}" for b in TRUNK for a in ("pitch", "roll", "yaw")]
          + [f"{s}_{n}" for s, _ in SIDES for n in LIMB])


def pose(**values):
    """A pose as named angles (degrees) and a hips offset (H; y + is backwards). Unset values are 0 (rest).

    Trunk: pitch + bends forward, roll + bends to the character's left, yaw + turns to its left.
    Per side: clav_up/clav_fwd shrug the shoulder up/forward, arm_flex raises the arm forward,
    arm_abd raises it sideways, arm_twist + turns it inwards, elbow/knee bend, wrist bends the hand
    forward, hip_flex swings the thigh forward, hip_abd moves it outwards, hip_twist turns the toes
    out, ankle + points the toes down.
    """
    p = dict.fromkeys(PARAMS, 0.0)
    p.update(values)
    return p


def swing(pitch=0.0, roll=0.0, yaw=0.0):
    """Rotation about the character's axes in degrees (X: right→left, Y: front→back, Z: up)."""
    r = math.radians
    return Quaternion((0, 0, 1), r(yaw)) @ Quaternion((0, 1, 0), r(roll)) @ Quaternion((1, 0, 0), r(pitch))


def apply_pose(p):
    def put(name, rotation, offset=None):
        # Each rotation is given in the character's axes relative to the parent bone; convert it
        # to the bone's own rest frame.
        rest = REST[name]
        pb = rig.pose.bones[name]
        pb.rotation_quaternion = rest.inverted() @ rotation @ rest
        if offset is not None:
            pb.location = rest.inverted() @ offset

    put("Hips", swing(p["hips_pitch"], p["hips_roll"], p["hips_yaw"]), Vector((p["hips_x"], p["hips_y"], p["hips_z"])) * H)
    for b in TRUNK[1:]:
        put(b.capitalize(), swing(p[f"{b}_pitch"], p[f"{b}_roll"], p[f"{b}_yaw"]))
    for s, k in SIDES:
        g = lambda n: p[f"{s}_{n}"]  # noqa: E731
        put(f"Shoulder.{s}", swing(roll=-k * g("clav_up"), yaw=-k * g("clav_fwd")))
        twist = Quaternion(REST_DIR[f"UpperArm.{s}"], math.radians(k * g("arm_twist")))
        put(f"UpperArm.{s}", swing(-g("arm_flex"), -k * g("arm_abd")) @ twist)
        put(f"LowerArm.{s}", swing(-g("elbow")))
        put(f"Hand.{s}", swing(-g("wrist")))
        # The legs keep pointing down when the pelvis tilts sideways.
        put(f"UpperLeg.{s}", swing(-g("hip_flex"), -k * g("hip_abd") - p["hips_roll"], k * g("hip_twist")))
        put(f"LowerLeg.{s}", swing(g("knee")))
        put(f"Foot.{s}", swing(g("ankle")))


# Side view of a leg, for planted feet: lengths and the sole (heel, toe tip) relative to the ankle.
THIGH = JOINTS["hip"][2] - JOINTS["knee"][2]
SHIN = JOINTS["knee"][2] - JOINTS["ankle"][2]
SOLE = ((0.07, -JOINTS["ankle"][2]), (-0.13, -JOINTS["ankle"][2] + 0.01))
HIP_DROP = JOINTS["hips"][2] - JOINTS["hip"][2]


def leg(p, s, theta, knee, ankle):
    """Leg by its thigh angle in the world (+ forward of vertical), knee bend and ankle."""
    p[f"{s}_hip_flex"] = theta + p["hips_pitch"]
    p[f"{s}_knee"] = knee
    p[f"{s}_ankle"] = ankle


def leg_ik(forward, down):
    """Thigh angle and knee bend that put the ankle `forward` in front of and `down` below the hip joint."""
    a, b = THIGH, SHIN
    dist = min(math.hypot(forward, down), a + b - 1e-6)
    knee = math.pi - math.acos((a * a + b * b - dist * dist) / (2 * a * b))
    theta = math.atan2(forward, down) + math.acos((a * a + dist * dist - b * b) / (2 * a * dist))
    return math.degrees(theta), math.degrees(knee)


def plant(p, s, reach=0.0):
    """Puts the foot flat on the floor, `reach` (H) in front of the hip joint."""
    hip_z = JOINTS["hips"][2] + p["hips_z"] - HIP_DROP * math.cos(math.radians(p["hips_pitch"]))
    theta, knee = leg_ik(reach, hip_z - JOINTS["ankle"][2])
    leg(p, s, theta, knee, theta - knee)


def sole_depth(theta, knee, ankle):
    """How far below the hip joint the lowest point of the sole is."""
    t, shin = math.radians(theta), math.radians(theta - knee)
    f = math.radians(ankle) - shin
    down = THIGH * math.cos(t) + SHIN * math.cos(shin)
    return down + max(-(y * math.sin(f) + z * math.cos(f)) for y, z in SOLE)


REST_DEPTH = sole_depth(0, 0, 0)

# ---------------------------------------------------------------- curves


def hermite(p0, p1, m0, m1, dt, s):
    s2, s3 = s * s, s * s * s
    return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * dt * m0 + (3 * s2 - 2 * s3) * p1 + (s3 - s2) * dt * m1


def loop_curve(keys):
    """Smooth periodic curve (Catmull-Rom) through (phase, value) keys; the phase wraps at 1."""
    keys = sorted(keys)
    n = len(keys)

    def key(i):
        q, r = divmod(i, n)
        return keys[r][0] + q, keys[r][1]

    def curve(u):
        u %= 1.0
        i = max((j for j in range(n) if keys[j][0] <= u), default=-1)
        (t0, v0), (t1, v1), (t2, v2), (t3, v3) = key(i - 1), key(i), key(i + 1), key(i + 2)
        return hermite(v1, v2, (v2 - v0) / (t2 - t0), (v3 - v1) / (t3 - t1), t2 - t1, (u - t1) / (t2 - t1))

    return curve


def shot_curve(keys):
    """Smooth curve through (time, value) keys without overshoot, at rest at both ends."""
    ts, vs = [k[0] for k in keys], [k[1] for k in keys]
    d = [(vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]) for i in range(len(keys) - 1)]
    m = [0.0] * len(keys)
    for i in range(1, len(keys) - 1):
        if d[i - 1] * d[i] > 0:
            m[i] = 2 / (1 / d[i - 1] + 1 / d[i])

    def curve(t):
        if t <= ts[0]:
            return vs[0]
        if t >= ts[-1]:
            return vs[-1]
        i = max(j for j in range(len(ts) - 1) if ts[j] <= t)
        dt = ts[i + 1] - ts[i]
        return hermite(vs[i], vs[i + 1], m[i], m[i + 1], dt, (t - ts[i]) / dt)

    return curve


def bump(u, center, width):
    """Periodic bell curve around `center` (phase)."""
    d = (u - center + 0.5) % 1.0 - 0.5
    return math.exp(-0.5 * (d / width) ** 2)


def smooth_max(a, b, k=0.004):
    m = max(a, b)
    return m + k * math.log(math.exp((a - m) / k) + math.exp((b - m) / k))


# ---------------------------------------------------------------- clips


def idle(t):
    """Relaxed stance: breathing, a slow weight shift, looking around a little. 4 s loop."""
    u = t / 4.0
    breath = math.sin(2 * math.pi * 2 * u)
    sway = math.sin(2 * math.pi * u)  # + weight on the left foot
    p = pose(hips_z=-0.0015, hips_roll=-1.5 * sway, spine_pitch=1.5, spine_roll=1.0 * sway, chest_roll=0.4 * sway,
             chest_pitch=-1.2 * breath, neck_pitch=1.0, head_pitch=2 + 1.5 * math.sin(2 * math.pi * (u + 0.3)),
             head_yaw=6 * math.sin(2 * math.pi * u + 1.2), head_roll=1.5 * math.sin(2 * math.pi * u + 0.4))
    for s, k in SIDES:
        free = (0.5 - 0.5 * k * sway) ** 2  # 1 when this leg carries no weight
        plant(p, s)
        p[f"{s}_hip_flex"] += 2.5 * free
        p[f"{s}_knee"] += 6 * free
        p.update({f"{s}_clav_up": 1.2 * breath, f"{s}_arm_abd": -8 + 0.8 * breath, f"{s}_arm_flex": 4,
                  f"{s}_arm_twist": 10, f"{s}_elbow": 16 + 2 * breath, f"{s}_wrist": 5})
    return p


RUN_CYCLE = 0.6  # seconds per stride (two steps); the game speeds it up or slows it down
RUN_LEAN = 9.0
# One leg through a stride (phase 0 = foot contact): thigh angle, knee bend, ankle.
RUN_THIGH = loop_curve([(0.00, 26), (0.10, 14), (0.20, -4), (0.30, -22), (0.42, -12), (0.55, 15), (0.70, 42), (0.82, 48), (0.92, 36)])
RUN_KNEE = loop_curve([(0.00, 14), (0.10, 34), (0.20, 30), (0.30, 16), (0.42, 85), (0.55, 110), (0.70, 85), (0.82, 50), (0.92, 22)])
RUN_ANKLE = loop_curve([(0.00, 2), (0.10, -20), (0.20, -25), (0.30, 12), (0.42, 15), (0.55, 15), (0.70, 5), (0.82, -5), (0.92, -2)])


def run(t):
    phi = t / RUN_CYCLE
    twist = math.cos(2 * math.pi * (phi - 0.82))  # +1 when the left thigh is furthest forward
    p = pose(hips_pitch=RUN_LEAN, hips_yaw=-7 * twist, hips_roll=-2.5 * math.cos(2 * math.pi * (phi - 0.12)),
             spine_pitch=4, spine_yaw=4 * twist, chest_yaw=6 * twist,
             chest_pitch=3 + 1.5 * math.cos(4 * math.pi * (phi - 0.15)), neck_pitch=-4,
             head_pitch=-7 - 1.5 * math.cos(4 * math.pi * (phi - 0.15)))
    p["spine_roll"] = -0.5 * p["hips_roll"]
    p["head_yaw"] = -0.6 * (p["hips_yaw"] + p["spine_yaw"] + p["chest_yaw"])
    depths = []
    for s, _ in SIDES:
        lp = (phi + (0.0 if s == "L" else 0.5)) % 1.0
        theta, knee, ankle = RUN_THIGH(lp), RUN_KNEE(lp), RUN_ANKLE(lp)
        leg(p, s, theta, knee, ankle)
        p[f"{s}_hip_abd"] = 1.5
        depths.append(sole_depth(theta, knee, ankle))
        # The arm swings against the leg on its side.
        arm = 8 - 45 * math.cos(2 * math.pi * (lp - 0.82))
        p.update({f"{s}_arm_flex": arm, f"{s}_elbow": 88 + 16 * (arm - 8) / 45, f"{s}_arm_abd": 12,
                  f"{s}_arm_twist": 18, f"{s}_clav_fwd": 0.15 * (arm - 8), f"{s}_wrist": 8})
    # The lower foot touches the floor; between steps the body is in the air for a moment.
    lift = 0.016 * (bump(phi, 0.40, 0.06) + bump(phi, 0.90, 0.06))
    p["hips_z"] = REST_DEPTH - smooth_max(*depths) + lift
    return p


def fall_keys():
    """Runs into the door: thrown back, stumbles, sits down hard, rolls onto the back and stays down."""
    keys = [(0.0, run(0.0))]

    def key(t, hips, trunk, arms, legs, **extra):
        p = pose(hips_pitch=hips[0], hips_y=hips[1], hips_z=hips[2], spine_pitch=trunk[0], chest_pitch=trunk[1],
                 neck_pitch=trunk[2], head_pitch=trunk[3], **extra)
        for s, _ in SIDES:
            for name, value in arms.items():
                p[f"{s}_{name}"] = value
            spec = legs[s]
            if isinstance(spec, tuple):
                leg(p, s, *spec)
            else:
                plant(p, s, spec)
        keys.append((t, p))

    key(0.07, (-6, 0.02, keys[0][1]["hips_z"] - 0.005), (-6, -12, -10, -20),
        dict(clav_up=10, clav_fwd=4, arm_flex=25, arm_abd=50, elbow=25, wrist=-10),
        {"L": (24, 18, -10), "R": (-18, 42, 15)})
    key(0.22, (-14, 0.10, -0.03), (-4, -4, 6, 10),
        dict(clav_up=15, arm_flex=20, arm_abd=95, elbow=30, wrist=-15),
        {"L": (30, 20, -20), "R": -0.06})
    key(0.40, (-38, 0.20, -0.15), (10, 8, 10, 12),
        dict(clav_up=12, arm_flex=25, arm_abd=110, elbow=35),
        {"L": 0.235, "R": 0.17})
    key(0.55, (-62, 0.28, -0.265), (16, 10, 12, 14),
        dict(clav_up=8, arm_flex=20, arm_abd=90, elbow=30),
        {"L": (92, 12, -15), "R": (95, 15, -10)})
    key(0.68, (-84, 0.31, -0.27), (6, 2, 18, 12),
        dict(clav_up=4, arm_flex=-10, arm_abd=85, elbow=22),
        {"L": (132, 30, 15), "R": (122, 40, 10)})
    key(0.85, (-76, 0.32, -0.275), (3, 2, 8, 2),
        dict(arm_flex=-25, arm_abd=80, elbow=18),
        {"L": (108, 40, 20), "R": (100, 30, 15)})
    key(1.10, (-72, 0.32, -0.278), (3, 3, 2, -4),
        dict(arm_flex=-35, arm_abd=70, elbow=15, wrist=10),
        {"L": (115, 55, 40), "R": (104, 30, 25)}, head_roll=12, head_yaw=10)
    return keys


def shot_clip(keys):
    curves = {name: shot_curve([(t, p[name]) for t, p in keys]) for name in PARAMS}
    return lambda t: {name: c(t) for name, c in curves.items()}


fall = shot_clip(fall_keys())

# Cheer: two jumps for joy (0.8 s each), turning a little to one side and then the other.
JUMP = 0.8
TAKEOFF = 0.34  # part of a jump spent on the floor (landing, crouch, push-off)
CHEER_ABD = loop_curve([(0.00, 110), (0.17, 92), (0.34, 115), (0.60, 122), (0.85, 118)])
CHEER_FLEX = loop_curve([(0.00, 15), (0.17, 25), (0.34, 12), (0.60, 10), (0.85, 12)])
CHEER_ELBOW = loop_curve([(0.00, 25), (0.17, 55), (0.34, 15), (0.60, 8), (0.85, 12)])
CHEER_TWIST = loop_curve([(0.00, -15), (0.17, -20), (0.34, -10), (0.60, -5), (0.85, -10)])
CHEER_CLAV = loop_curve([(0.00, 10), (0.17, 4), (0.34, 14), (0.60, 18), (0.85, 16)])
CHEER_CHEST = loop_curve([(0.00, 0), (0.17, 6), (0.34, -4), (0.60, -10), (0.85, -6)])
CHEER_HEAD = loop_curve([(0.00, -4), (0.17, 6), (0.34, -8), (0.60, -16), (0.85, -12)])
AIR_THIGH = shot_curve([(0.0, 0), (0.35, 32), (0.7, 26), (1.0, 0)])
AIR_KNEE = shot_curve([(0.0, 0), (0.35, 65), (0.7, 50), (1.0, 0)])
AIR_ANKLE = shot_curve([(0.0, 0), (0.15, 30), (0.7, 18), (1.0, 0)])


def cheer(t):
    n, u = divmod(t / JUMP, 1.0)
    turn = 10 if int(n) % 2 == 0 else -10  # where this jump lands
    p = pose()
    if u < TAKEOFF:
        crouch = math.sin(math.pi * u / TAKEOFF)
        p.update(hips_pitch=10 * crouch, hips_z=-0.075 * crouch, hips_yaw=-turn)
        for s, _ in SIDES:
            plant(p, s)
    else:
        a = (u - TAKEOFF) / (1 - TAKEOFF)
        p.update(hips_pitch=-3 * math.sin(math.pi * a), hips_z=0.8 * a * (1 - a),
                 hips_yaw=-turn + 2 * turn * smoothstep(0.1, 0.9, a))
        for s, _ in SIDES:
            leg(p, s, AIR_THIGH(a), AIR_KNEE(a), AIR_ANKLE(a))
    p.update(spine_pitch=0.6 * CHEER_CHEST(u), chest_pitch=CHEER_CHEST(u), neck_pitch=0.3 * CHEER_HEAD(u),
             head_pitch=CHEER_HEAD(u), head_yaw=-0.5 * p["hips_yaw"])
    for s, _ in SIDES:
        p.update({f"{s}_arm_abd": CHEER_ABD(u), f"{s}_arm_flex": CHEER_FLEX(u), f"{s}_elbow": CHEER_ELBOW(u),
                  f"{s}_arm_twist": CHEER_TWIST(u), f"{s}_clav_up": CHEER_CLAV(u)})
    return p


def sad(t):
    """Slumped, head down, a long sigh and a slow shake of the head. 4 s loop."""
    u = t / 4.0
    breath = math.sin(2 * math.pi * u)
    sway = math.sin(2 * math.pi * u + 0.8)
    shake_env = math.sin(math.pi * min(1.0, max(0.0, (u - 0.55) / 0.4))) ** 2
    shake = 12 * shake_env * math.sin(2 * math.pi * 2 * (u - 0.55) / 0.4)
    p = pose(hips_pitch=-3, hips_roll=-1.2 * sway, spine_roll=0.8 * sway, hips_z=-0.0045 - 0.0012 * (1 - breath),
             spine_pitch=7 - 1.5 * breath, chest_pitch=9 - 3 * breath, neck_pitch=6 - 1.5 * breath,
             head_pitch=13 - 3 * breath + 2 * shake_env, neck_yaw=0.4 * shake, head_yaw=shake, head_roll=2 * sway)
    for s, k in SIDES:
        free = (0.5 - 0.5 * k * sway) ** 2
        plant(p, s)
        p[f"{s}_hip_flex"] += 2 * free
        p[f"{s}_knee"] += 4 * free
        p.update({f"{s}_clav_up": -6 + 4 * breath, f"{s}_clav_fwd": 10, f"{s}_arm_flex": 8 - 2 * breath,
                  f"{s}_arm_abd": -6, f"{s}_arm_twist": 15, f"{s}_elbow": 12, f"{s}_wrist": 6})
    return p


CLIPS = (  # name, seconds, loops, pose at time t
    ("Idle", 4.0, True, idle),
    ("Run", RUN_CYCLE, True, run),
    ("Fall", 1.1, False, fall),
    ("Cheer", 2 * JUMP, True, cheer),
    ("Sad", 4.0, True, sad),
)

# ---------------------------------------------------------------- keying
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
rig.animation_data_create()
actions = []
for name, seconds, loops, fn in CLIPS:
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    rig.animation_data.action = action
    frames = round(seconds * FPS)
    previous = {}
    for f in range(frames + 1):
        apply_pose(fn(f / FPS))
        for pb in rig.pose.bones:
            q = pb.rotation_quaternion.copy()
            if pb.name in previous and previous[pb.name].dot(q) < 0:
                q.negate()
                pb.rotation_quaternion = q
            previous[pb.name] = q
            pb.keyframe_insert("rotation_quaternion", frame=f, group=pb.name)
        rig.pose.bones["Hips"].keyframe_insert("location", frame=f, group="Hips")
    actions.append((name, action, frames, loops))
    print(f"[rig] {name}: {frames} frames")

# ---------------------------------------------------------------- preview renders
if PREVIEW_DIR:
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    bpy.ops.mesh.primitive_plane_add(size=8 * H, location=(0, 0, ZMIN))
    floor = bpy.context.object
    floor_mat = bpy.data.materials.new("Floor")
    floor_mat.diffuse_color = (0.22, 0.24, 0.28, 1.0)
    floor.data.materials.append(floor_mat)
    cam = bpy.data.objects.new("PreviewCam", bpy.data.cameras.new("PreviewCam"))
    scene.collection.objects.link(cam)
    scene.camera = cam
    scene.render.engine = "BLENDER_WORKBENCH"
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "TEXTURE"
    shading.show_shadows = True
    scene.render.resolution_x, scene.render.resolution_y = 300, 360
    views = {
        "front": ((0, -2.8, 0.75), (0, 0.1, 0.5)),
        "side": ((2.8, 0.35, 0.75), (0, 0.35, 0.45)),
        "back": ((1.1, 2.4, 1.5), (0, 0.1, 0.45)),
    }
    for name, action, frames, loops in actions:
        rig.animation_data.action = action
        count = 8
        for i in range(count):
            scene.frame_set(round(i * frames / (count if loops else count - 1)))
            for view, (loc, target) in views.items():
                loc = Vector(loc) * H + Vector((0, 0, ZMIN))
                target = Vector(target) * H + Vector((0, 0, ZMIN))
                cam.location = loc
                cam.rotation_euler = (target - loc).to_track_quat("-Z", "Y").to_euler()
                scene.render.filepath = os.path.join(PREVIEW_DIR, f"{name}_{view}_{i:02d}.png")
                bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(floor)

# ---------------------------------------------------------------- export
rig.animation_data.action = None
for name, action, frames, loops in actions:
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 0, action)

bpy.ops.object.select_all(action="DESELECT")
mesh.select_set(True)
rig.select_set(True)
options = dict(
    filepath=OUT_PATH,
    export_format="GLB",
    use_selection=True,
    export_animations=True,
    export_animation_mode="NLA_TRACKS",
    export_anim_slide_to_zero=True,
    export_force_sampling=True,
    export_image_format="JPEG",
    export_jpeg_quality=85,
    export_skins=True,
    export_yup=True,
)
supported = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
bpy.ops.export_scene.gltf(**{k: v for k, v in options.items() if k in supported})
print(f"[rig] exported {OUT_PATH} ({os.path.getsize(OUT_PATH) / 1e6:.1f} MB)")
