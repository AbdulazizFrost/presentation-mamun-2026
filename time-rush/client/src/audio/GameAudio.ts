/**
 * Music and sound effects for the projector, synthesized with the Web Audio API (no audio files).
 * Browsers only allow sound after a user gesture, so the context is created on the first click.
 */

export type MusicMode = 'off' | 'lobby' | 'race';
export type Sfx = 'beep' | 'go' | 'tick' | 'vote' | 'correct' | 'door' | 'wrong' | 'win' | 'lose';

const MUTE_KEY = 'time-rush:muted';
const BPM = 116;
const STEP = 60 / BPM / 4; // one sixteenth note
const LOOKAHEAD = 0.15;

const midi = (note: number) => 440 * 2 ** ((note - 69) / 12);

// Four bars, Am – F – C – G: bass root, chord tones and a melody on sixteenth steps (null = rest).
const BARS = [
  { bass: 45, chord: [57, 60, 64], melody: [76, null, 74, null, 72, null, 69, null, null, null, 72, null, 74, null, null, null] },
  { bass: 41, chord: [53, 57, 60], melody: [77, null, 76, null, 72, null, 69, null, null, null, 69, null, 72, null, null, null] },
  { bass: 48, chord: [55, 60, 64], melody: [76, null, 79, null, 76, null, 72, null, null, null, 74, null, 76, null, null, null] },
  { bass: 43, chord: [55, 59, 62], melody: [74, null, 71, null, 67, null, 71, null, 74, null, null, null, null, null, null, null] },
] as const;

interface ToneOptions {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  /** Frequency at the end of the note (a slide), Hz. */
  slideTo?: number;
  lowpass?: number;
  vibrato?: number;
}

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private mode: MusicMode = 'off';
  private wanted: MusicMode = 'off';
  private mutedValue = loadMuted();
  private readonly listeners = new Set<() => void>();

  get muted(): boolean {
    return this.mutedValue;
  }

  /** Creates the audio context; call from a user gesture. */
  unlock(): void {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;
      const compressor = ctx.createDynamicsCompressor();
      compressor.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.gain.value = this.mutedValue ? 0 : 0.9;
      this.master.connect(compressor);
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0.32;
      this.musicBus.connect(this.master);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.85;
      this.sfxBus.connect(this.master);
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.setMusic(this.wanted);
  }

  setMuted(muted: boolean): void {
    this.mutedValue = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      // not stored in private mode
    }
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
    for (const listener of this.listeners) listener();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Background music: calm in the lobby, full band during the race. */
  setMusic(mode: MusicMode): void {
    this.wanted = mode;
    const ctx = this.ctx;
    if (!ctx || mode === this.mode) return;
    this.mode = mode;
    if (mode === 'off') {
      if (this.timer !== null) window.clearInterval(this.timer);
      this.timer = null;
      this.musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      return;
    }
    this.musicBus.gain.setTargetAtTime(mode === 'race' ? 0.32 : 0.22, ctx.currentTime, 0.3);
    if (this.timer === null) {
      this.nextTime = ctx.currentTime + 0.05;
      this.step = 0;
      this.timer = window.setInterval(() => this.schedule(), 25);
    }
  }

  /** Plays an effect now or `delay` seconds later. */
  play(sfx: Sfx, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + delay;
    const out = this.sfxBus;
    switch (sfx) {
      case 'beep':
        this.tone(out, midi(81), t, 0.18, { type: 'square', gain: 0.18, lowpass: 3000 });
        break;
      case 'go':
        for (const n of [72, 76, 79, 84]) this.tone(out, midi(n), t, 0.55, { type: 'square', gain: 0.12, lowpass: 3500 });
        this.noiseHit(out, t, 0.4, 2500, 0.15, 'highpass');
        break;
      case 'tick':
        this.tone(out, 1500, t, 0.05, { type: 'square', gain: 0.12, lowpass: 5000 });
        break;
      case 'vote':
        this.tone(out, midi(88), t, 0.08, { type: 'sine', gain: 0.12, slideTo: midi(93) });
        break;
      case 'correct':
        [72, 76, 79, 84, 88].forEach((n, i) => this.tone(out, midi(n), t + i * 0.07, 0.35, { type: 'triangle', gain: 0.22 }));
        this.tone(out, midi(96), t + 0.35, 0.5, { type: 'sine', gain: 0.08 });
        break;
      case 'door':
        this.noiseHit(out, t, 0.55, 900, 0.22, 'bandpass', 4000);
        break;
      case 'wrong':
        this.tone(out, 180, t, 0.45, { type: 'sawtooth', gain: 0.22, slideTo: 70, lowpass: 900 });
        this.tone(out, 120, t, 0.25, { type: 'sine', gain: 0.5, slideTo: 40 });
        this.noiseHit(out, t, 0.25, 400, 0.3, 'lowpass');
        break;
      case 'win':
        [67, 72, 76].forEach((n, i) => this.tone(out, midi(n), t + i * 0.14, 0.2, { type: 'sawtooth', gain: 0.12, lowpass: 2500 }));
        for (const n of [72, 76, 79, 84]) this.tone(out, midi(n), t + 0.45, 1.4, { type: 'sawtooth', gain: 0.09, lowpass: 2800, vibrato: 4 });
        this.noiseHit(out, t + 0.45, 1.2, 6000, 0.06, 'highpass');
        break;
      case 'lose':
        [67, 66, 65].forEach((n, i) => this.tone(out, midi(n), t + i * 0.45, 0.42, { type: 'sawtooth', gain: 0.14, lowpass: 1100 }));
        this.tone(out, midi(64), t + 1.35, 1.2, { type: 'sawtooth', gain: 0.14, lowpass: 1000, vibrato: 6 });
        break;
    }
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step = (this.step + 1) % 64;
    }
  }

  private playStep(step: number, t: number): void {
    const bar = BARS[Math.floor(step / 16)]!;
    const s = step % 16;
    const out = this.musicBus;
    const race = this.mode === 'race';
    // Bass on eighth notes, jumping an octave on the off-beats.
    if (s % 2 === 0) {
      const note = s % 4 === 2 ? bar.bass + 12 : bar.bass;
      this.tone(out, midi(note), t, STEP * 1.8, { type: 'sawtooth', gain: race ? 0.2 : 0.12, lowpass: 600 });
    }
    // Arpeggio over the chord.
    if (race || s % 2 === 0) {
      const note = bar.chord[(s >> (race ? 0 : 1)) % 3]! + 12;
      this.tone(out, midi(note), t, STEP * 0.9, { type: 'triangle', gain: race ? 0.07 : 0.06 });
    }
    // Soft pad at the start of each bar.
    if (s === 0) for (const n of bar.chord) this.tone(out, midi(n), t, STEP * 15, { type: 'sine', gain: 0.05, attack: 0.3 });
    if (!race) return;
    const melody = bar.melody[s];
    if (melody) this.tone(out, midi(melody), t, STEP * 1.6, { type: 'square', gain: 0.05, lowpass: 2200 });
    // Drums: kick on the beat, snare on 2 and 4, hi-hats on the off-beats.
    if (s % 4 === 0) this.tone(out, 140, t, 0.18, { type: 'sine', gain: 0.6, slideTo: 45 });
    if (s === 4 || s === 12) this.noiseHit(out, t, 0.16, 1800, 0.22, 'bandpass');
    if (s % 2 === 1) this.noiseHit(out, t, 0.04, 7000, 0.08, 'highpass');
  }

  private tone(out: AudioNode, freq: number, t: number, dur: number, o: ToneOptions = {}): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
    if (o.vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = o.vibrato;
      depth.gain.value = freq * 0.012;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    const env = ctx.createGain();
    const peak = o.gain ?? 0.2;
    const attack = o.attack ?? 0.008;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(peak, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.02));
    let node: AudioNode = osc;
    if (o.lowpass) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = o.lowpass;
      node.connect(filter);
      node = filter;
    }
    node.connect(env).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noiseHit(out: AudioNode, t: number, dur: number, freq: number, gain: number, type: BiquadFilterType, sweepTo?: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(env).connect(out);
    src.start(t);
    src.stop(t + dur + 0.05);
  }
}

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

/** One audio engine for the projector page. */
export const gameAudio = new GameAudio();
