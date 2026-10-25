import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { TeamId } from '@shared/types/game';
import { TEAM_COLORS } from './palette';
import { MixerRunnerAnimator, RigidRunnerAnimator, type ClipRole, type RunnerAnimator } from './RunnerAnimator';
import type { RunnerView } from './RunnerView';

/**
 * Optional custom runner, described by client/public/models/runner.json:
 *
 * {
 *   "model": "runner.glb",                       // .glb/.gltf or .fbx, rigged (e.g. auto-rigged on Mixamo)
 *   "animations": {                               // optional: clip files, or clip names inside the model
 *     "idle": "animations/idle.fbx",
 *     "run": "animations/run.fbx",
 *     "fall": "animations/fall.fbx",
 *     "getUp": "animations/getup.fbx",
 *     "cheer": "animations/victory.fbx",
 *     "sad": "animations/defeat.fbx"
 *   },
 *   "height": 1.7,                                // optional: target height in metres (default 1.7)
 *   "rotationY": 180,                             // optional: degrees, so the runner faces away from the camera
 *   "teamB": { "hueFrom": [170, 265], "hueTo": 130 } // optional: recolour blue parts green for Team B
 * }
 *
 * A model without animations (no skeleton) is animated as a whole: bobbing, leaning, falling, jumping.
 *
 * Without runner.json the built-in primitive runner is used.
 */
interface RunnerManifest {
  model: string;
  animations?: Partial<Record<ClipRole, string>>;
  height?: number;
  rotationY?: number;
  /** Hue range (degrees) of the textures to move to `hueTo` for Team B. Set to false to keep colours. */
  teamB?: { hueFrom: [number, number]; hueTo: number } | false;
}

export interface RunnerAssets {
  model: THREE.Object3D;
  clips: Partial<Record<ClipRole, THREE.AnimationClip>>;
  manifest: RunnerManifest;
}

const BASE = '/models/';
const ROLES: ClipRole[] = ['idle', 'run', 'fall', 'getUp', 'cheer', 'sad'];
/** Used to find clips inside the model file when the manifest does not name them. */
const ROLE_PATTERNS: Record<ClipRole, RegExp> = {
  idle: /idle|breath/i,
  run: /run|sprint|jog/i,
  fall: /fall|stumble|knock|hit|death/i,
  getUp: /get.?up|stand.?up/i,
  cheer: /victory|cheer|celebrat|win|dance/i,
  sad: /defeat|sad|lose|disappoint/i,
};

/** Mixamo prefixes bones with "mixamorig:" (or "mixamorig" after a Blender round trip). */
const normalizeBoneName = (name: string) => name.replace(/^mixamorig[:_]?/i, '');

async function loadFile(url: string): Promise<{ scene: THREE.Object3D; animations: THREE.AnimationClip[] }> {
  if (/\.fbx$/i.test(url)) {
    const fbx = await new FBXLoader().loadAsync(url);
    return { scene: fbx, animations: fbx.animations };
  }
  const gltf = await new GLTFLoader().loadAsync(url);
  return { scene: gltf.scene, animations: gltf.animations };
}

/**
 * Resolves when every texture of the model has its image decoded. Loaders (e.g. FBX with embedded
 * textures) assign `texture.image` only after an asynchronous load, so we poll briefly.
 */
async function waitForTextures(root: THREE.Object3D, timeoutMs = 20000): Promise<void> {
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  const ready = (t: THREE.Texture) => {
    const image = t.image as { width?: number; complete?: boolean } | undefined;
    return !!image && (image.width ?? 0) > 0 && image.complete !== false;
  };
  const started = performance.now();
  while ([...textures].some((t) => !ready(t)) && performance.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/** Renames tracks to the normalised bone names and removes forward root motion ("in place"). */
function prepareClip(clip: THREE.AnimationClip, role: ClipRole): THREE.AnimationClip {
  const prepared = clip.clone();
  prepared.name = role;
  for (const track of prepared.tracks) {
    const dot = track.name.lastIndexOf('.');
    const node = track.name.slice(0, dot);
    const property = track.name.slice(dot);
    track.name = normalizeBoneName(node) + property;
    // Keep the hips in place horizontally so the game controls where the runner is.
    if (/hips\.position$/i.test(track.name) && role !== 'fall' && role !== 'getUp') {
      const values = track.values;
      const x0 = values[0] ?? 0;
      const z0 = values[2] ?? 0;
      for (let i = 0; i < values.length; i += 3) {
        values[i] = x0;
        values[i + 2] = z0;
      }
    }
  }
  return prepared;
}

/** Loads runner.json and its files. Resolves to null when no custom runner is configured. */
export async function loadRunnerAssets(): Promise<RunnerAssets | null> {
  let manifest: RunnerManifest;
  try {
    const res = await fetch(`${BASE}runner.json`, { cache: 'no-cache' });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return null;
    manifest = (await res.json()) as RunnerManifest;
  } catch {
    return null;
  }
  if (!manifest.model) return null;

  const main = await loadFile(BASE + manifest.model);
  // FBX/GLB textures finish decoding after the model itself; recolouring needs the pixels.
  await waitForTextures(main.scene);
  main.scene.traverse((object) => {
    object.name = normalizeBoneName(object.name);
  });

  const clips: Partial<Record<ClipRole, THREE.AnimationClip>> = {};
  for (const role of ROLES) {
    const source = manifest.animations?.[role];
    let clip: THREE.AnimationClip | undefined;
    if (source && /\.(fbx|glb|gltf)$/i.test(source)) {
      clip = (await loadFile(BASE + source)).animations[0];
    } else if (source) {
      clip = main.animations.find((c) => c.name === source);
    } else {
      clip = main.animations.find((c) => ROLE_PATTERNS[role].test(c.name));
    }
    if (clip) clips[role] = prepareClip(clip, role);
  }
  return { model: main.scene, clips, manifest };
}

/**
 * Moves one hue range of a texture to another hue (e.g. blue hair and jacket → green), keeping
 * brightness and the other colours (skin, white, black) unchanged. Done once on a canvas.
 */
function recolorTexture(texture: THREE.Texture, hueFrom: [number, number], hueTo: number): THREE.Texture {
  const image = texture.image as CanvasImageSource & { width: number; height: number };
  if (!image || !image.width) return texture;
  const scale = Math.min(1, 2048 / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return texture;
  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;
  const [lo, hi] = hueFrom;
  const shift = hueTo - (lo + hi) / 2;
  for (let i = 0; i < px.length; i += 4) {
    const r = (px[i] ?? 0) / 255;
    const g = (px[i + 1] ?? 0) / 255;
    const b = (px[i + 2] ?? 0) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (max < 0.08 || d / max < 0.18) continue; // too dark or too grey
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    if (h < lo || h > hi) continue;
    const nh = (((h + shift) % 360) + 360) % 360;
    const s = d / max;
    const c = max * s;
    const x = c * (1 - Math.abs(((nh / 60) % 2) - 1));
    const m = max - c;
    const [r1, g1, b1] = nh < 60 ? [c, x, 0] : nh < 120 ? [x, c, 0] : nh < 180 ? [0, c, x] : nh < 240 ? [0, x, c] : nh < 300 ? [x, 0, c] : [c, 0, x];
    px[i] = Math.round((r1 + m) * 255);
    px[i + 1] = Math.round((g1 + m) * 255);
    px[i + 2] = Math.round((b1 + m) * 255);
  }
  ctx.putImageData(data, 0, 0);
  const result = new THREE.CanvasTexture(canvas);
  result.colorSpace = texture.colorSpace;
  result.flipY = texture.flipY;
  result.wrapS = texture.wrapS;
  result.wrapT = texture.wrapT;
  result.repeat.copy(texture.repeat);
  result.offset.copy(texture.offset);
  return result;
}

const recolorCache = new WeakMap<THREE.Texture, THREE.Texture>();

/**
 * A runner made from your model. Rigged models with clips use an AnimationMixer; models without
 * a skeleton are animated as a whole. Team B gets a recoloured copy (blue parts turned green), and
 * materials whose name contains "team" take the team colour.
 */
export class GltfRunnerView implements RunnerView {
  readonly root = new THREE.Group();
  /** Sits at the model's feet; the rigid animator tilts and bobs it. */
  private readonly pivot = new THREE.Group();
  private readonly model: THREE.Object3D;

  constructor(
    team: TeamId,
    private readonly assets: RunnerAssets,
  ) {
    this.model = cloneSkinned(assets.model);
    const recolor = team === 'B' && assets.manifest.teamB !== false ? (assets.manifest.teamB ?? { hueFrom: [170, 265] as [number, number], hueTo: 130 }) : null;
    this.model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.frustumCulled = false; // skinned meshes can leave their bind-pose bounds while running
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const adjusted = materials.map((material: THREE.Material) => {
        const named = /team/i.test(material.name) && 'color' in material;
        const mapped = recolor && 'map' in material && (material as THREE.MeshStandardMaterial).map;
        if (!named && !mapped) return material;
        const copy = material.clone() as THREE.MeshStandardMaterial;
        if (named) copy.color.set(TEAM_COLORS[team]);
        if (recolor && copy.map) {
          let tinted = recolorCache.get(copy.map);
          if (!tinted) {
            tinted = recolorTexture(copy.map, recolor.hueFrom, recolor.hueTo);
            recolorCache.set(copy.map, tinted);
          }
          copy.map = tinted;
        }
        return copy;
      });
      object.material = Array.isArray(object.material) ? adjusted : (adjusted[0] ?? object.material);
    });

    // Scale to the target height and stand on the floor.
    const box = new THREE.Box3().setFromObject(this.model);
    const height = Math.max(0.001, box.max.y - box.min.y);
    const scale = (assets.manifest.height ?? 1.7) / height;
    this.model.scale.setScalar(scale);
    this.model.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale, -((box.min.z + box.max.z) / 2) * scale);
    const turn = new THREE.Group();
    turn.rotation.y = THREE.MathUtils.degToRad(assets.manifest.rotationY ?? 180);
    turn.add(this.model);
    this.pivot.add(turn);
    this.root.add(this.pivot);
  }

  createAnimator(): RunnerAnimator {
    const hasClips = Object.keys(this.assets.clips).length > 0;
    return hasClips ? new MixerRunnerAnimator(this.model, this.assets.clips) : new RigidRunnerAnimator(this.pivot);
  }
}
