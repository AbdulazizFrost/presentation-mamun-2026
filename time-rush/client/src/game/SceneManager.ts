import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { LAYOUT } from './layout';
import { PALETTE } from './palette';

/**
 * dt: capped frame delta for smooth motion; elapsed: total time;
 * realDt: uncapped delta, so timed sequences stay in sync with the server even when frames are rare.
 */
export type FrameCallback = (dt: number, elapsed: number, realDt: number) => void;

/**
 * One canvas: renderer, scene, camera, bloom and the animation loop.
 * Quality adapts: if frames get slow the bloom pass is switched off and the pixel ratio lowered.
 */
export class SceneManager {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly clock = new THREE.Clock();
  private readonly resizeObserver: ResizeObserver;
  private readonly offset = new THREE.Vector3(...LAYOUT.camera.offset);
  private readonly lookAhead = new THREE.Vector3(...LAYOUT.camera.lookAt);
  /** Corridor position the camera follows (the runner's z). */
  followZ = 0;
  /** When true the camera swings round to look at the runner from the front (finish). */
  showcase = false;
  private cameraZ = 0;
  private readonly camPos = new THREE.Vector3();
  private readonly camLook = new THREE.Vector3();
  private readonly tmpPos = new THREE.Vector3();
  private readonly tmpLook = new THREE.Vector3();
  private cameraReady = false;
  private frameId = 0;
  private elapsed = 0;
  private callbacks: FrameCallback[] = [];
  private slowFrames = 0;
  private quality: 'high' | 'low' = 'high';
  /** 0..1, decays: shakes the camera on impacts. */
  shake = 0;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(PALETTE.background);
    this.scene.fog = new THREE.Fog(PALETTE.background, 20, 52);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.3;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(LAYOUT.camera.fov, 1, 0.1, 120);
    this.camera.position.copy(this.offset);
    this.camera.lookAt(this.lookAhead);

    this.scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1f2c, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(2, 8, 6);
    this.scene.add(key);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.25, 0.3, 0.97);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
  }

  onFrame(callback: FrameCallback): void {
    this.callbacks.push(callback);
  }

  start(): void {
    if (this.frameId) return;
    this.clock.start();
    const loop = () => {
      this.frameId = requestAnimationFrame(loop);
      const realDt = Math.min(this.clock.getDelta(), 5);
      const dt = Math.min(realDt, 0.05);
      this.elapsed += realDt;
      for (const callback of this.callbacks) callback(dt, this.elapsed, realDt);
      this.applyCamera(dt, realDt);
      this.trackPerformance(realDt);
      if (this.quality === 'high') this.composer.render(dt);
      else this.renderer.render(this.scene, this.camera);
    };
    this.frameId = requestAnimationFrame(loop);
  }

  /** Follows the runner smoothly; snaps when the gap is large (e.g. after a reload). */
  private applyCamera(dt: number, realDt: number): void {
    const gap = this.followZ - this.cameraZ;
    // Real time, so the camera keeps up with the runner even when frames are rare.
    this.cameraZ = Math.abs(gap) > 30 ? this.followZ : this.cameraZ + gap * (1 - Math.exp(-realDt * 8));
    this.shake = Math.max(0, this.shake - dt * 2.2);
    const s = this.shake * this.shake * 0.22;
    const sway = Math.sin(this.elapsed * 0.6) * 0.06;
    if (this.showcase) {
      // Slowly orbit a little in front of the runner, looking at its face.
      const angle = Math.sin(this.elapsed * 0.35) * 0.35;
      this.tmpPos.set(Math.sin(angle) * 4.2, 1.75, this.followZ - Math.cos(angle) * 4.2);
      this.tmpLook.set(0, 1.0, this.followZ);
    } else {
      this.tmpPos.set(this.offset.x + sway, this.offset.y, this.cameraZ + this.offset.z);
      this.tmpLook.set(this.lookAhead.x, this.lookAhead.y, this.cameraZ + this.lookAhead.z);
    }
    if (!this.cameraReady) {
      this.camPos.copy(this.tmpPos);
      this.camLook.copy(this.tmpLook);
      this.cameraReady = true;
    }
    // Ease between the follow view and the showcase view (a smooth swing round).
    const k = this.showcase ? 1 - Math.exp(-realDt * 2.2) : 1;
    this.camPos.lerp(this.tmpPos, k);
    this.camLook.lerp(this.tmpLook, k);
    this.camera.position.set(this.camPos.x + (Math.random() - 0.5) * s, this.camPos.y + (Math.random() - 0.5) * s, this.camPos.z);
    this.camera.lookAt(this.camLook);
  }

  /** +1 when the camera looks back along +Z (showcase), -1 normally. */
  get lookDirection(): number {
    return this.camLook.z > this.camPos.z ? 1 : -1;
  }

  get cameraPositionZ(): number {
    return this.camera.position.z;
  }

  /** Switches to the cheaper renderer after ~2 s of frames slower than ~35 FPS (visible tab only). */
  private trackPerformance(realDt: number): void {
    if (this.quality === 'low' || document.hidden || realDt > 0.5) return;
    this.slowFrames = realDt > 1 / 35 ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 2);
    if (this.slowFrames > 120) {
      this.quality = 'low';
      this.renderer.setPixelRatio(1);
      this.resize();
      console.info('[time-rush] Low frame rate: bloom disabled to keep the game smooth.');
    }
  }

  stop(): void {
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }

  private resize(): void {
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloom.resolution.set(width / 2, height / 2);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.stop();
    this.resizeObserver.disconnect();
    this.callbacks = [];
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
          material.dispose();
        }
      }
    });
    this.scene.environment?.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
