/* Tiny procedural sound engine — no audio files, all WebAudio.
   Music is a laid-back diner swing loop; effects are short synthesised cues. */

type SfxName =
  | "pickup"
  | "place"
  | "chop"
  | "chopDone"
  | "sizzle"
  | "cooked"
  | "serve"
  | "error"
  | "expire"
  | "tick"
  | "go"
  | "trash"
  | "fire";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  private muted = false;
  private musicPlaying = false;
  private musicWanted = false;

  init(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(ctx.destination);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.2;
    this.musicGain.connect(this.master);

    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = 0.65;
    this.sfxGain.connect(this.master);

    const len = Math.floor(ctx.sampleRate * 1.2);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.03);
    }
    try {
      localStorage.setItem("sizzle-chaos-muted", muted ? "1" : "0");
    } catch {
      /* storage can be unavailable */
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  loadMutedPreference(): void {
    try {
      this.muted = localStorage.getItem("sizzle-chaos-muted") === "1";
    } catch {
      this.muted = false;
    }
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    when = 0,
    endFreq?: number,
    destination?: AudioNode,
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    g.connect(destination ?? this.sfxGain ?? ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private noise(
    duration: number,
    gain: number,
    when = 0,
    filter: "lowpass" | "highpass" | "bandpass" = "bandpass",
    freq = 900,
    q = 0.8,
    destination?: AudioNode,
  ): void {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuffer) return;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(f);
    f.connect(g);
    g.connect(destination ?? this.sfxGain ?? ctx.destination);
    src.start(t);
    src.stop(t + duration + 0.02);
  }

  play(name: SfxName): void {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    switch (name) {
      case "pickup":
        this.tone(620, 0.09, "sine", 0.12, 0, 940);
        break;
      case "place":
        this.tone(170, 0.11, "sine", 0.18, 0, 110);
        this.noise(0.06, 0.04, 0, "lowpass", 500, 0.7);
        break;
      case "chop":
        this.noise(0.07, 0.13, 0, "bandpass", 240, 1.1);
        this.tone(110, 0.06, "square", 0.03, 0, 70);
        break;
      case "chopDone":
        this.tone(660, 0.09, "triangle", 0.12, 0);
        this.tone(990, 0.12, "triangle", 0.09, 0.07);
        break;
      case "sizzle":
        this.noise(0.55, 0.11, 0, "highpass", 2400, 0.6);
        this.noise(0.35, 0.05, 0.05, "bandpass", 4200, 0.7);
        break;
      case "cooked":
        this.tone(880, 0.18, "sine", 0.12, 0);
        this.tone(1320, 0.24, "sine", 0.08, 0.1);
        break;
      case "serve":
        this.tone(780, 0.22, "sine", 0.14, 0);
        this.tone(1170, 0.26, "sine", 0.11, 0.11);
        this.tone(1560, 0.5, "sine", 0.08, 0.22);
        break;
      case "error":
        this.tone(180, 0.18, "sawtooth", 0.08, 0, 130);
        this.tone(140, 0.22, "sawtooth", 0.07, 0.14, 100);
        break;
      case "expire":
        this.tone(330, 0.2, "triangle", 0.1, 0, 280);
        this.tone(250, 0.3, "triangle", 0.09, 0.18, 180);
        break;
      case "tick":
        this.tone(1000, 0.05, "square", 0.05, 0);
        break;
      case "go":
        this.tone(520, 0.12, "triangle", 0.12, 0);
        this.tone(780, 0.2, "triangle", 0.12, 0.1);
        this.tone(1040, 0.36, "triangle", 0.1, 0.2);
        break;
      case "trash":
        this.tone(120, 0.15, "sine", 0.14, 0, 70);
        this.noise(0.14, 0.06, 0.02, "lowpass", 450, 0.7);
        break;
      case "fire":
        this.noise(0.35, 0.06, 0, "bandpass", 1800, 0.9);
        break;
    }
  }

  startMusic(): void {
    this.musicWanted = true;
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    this.step = 0;
    if (this.musicGain) this.musicGain.gain.value = 0.17;
    const interval = 238; // ~126 bpm eighth notes
    this.musicTimer = window.setInterval(() => this.musicStep(), interval);
    this.musicStep();
  }

  pauseMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    this.musicGain.gain.setTargetAtTime(0.02, this.ctx.currentTime, 0.1);
  }

  resumeMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    this.musicGain.gain.setTargetAtTime(this.musicWanted ? 0.17 : 0, this.ctx.currentTime, 0.1);
  }

  stopMusic(): void {
    this.musicWanted = false;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicPlaying = false;
  }

  private musicStep(): void {
    if (!this.ctx || !this.musicGain) return;
    if (this.ctx.state === "suspended") return;
    const step = this.step % 32;
    const t = 0;
    // walking upright bass
    const bassPattern = [55, 0, 0, 82.4, 0, 0, 73.4, 0, 65.4, 0, 0, 98, 0, 82.4, 73.4, 0];
    const bassNote = bassPattern[step % 16];
    if (bassNote) {
      this.tone(bassNote, 0.32, "triangle", 0.16, t, bassNote * 0.99, this.musicGain);
    }
    // brushed swing chords on offbeats
    const chords: Record<number, number[]> = {
      2: [220, 261.6, 329.6],
      6: [196, 246.9, 293.7],
      10: [174.6, 220, 261.6],
      14: [196, 246.9, 329.6],
      18: [220, 261.6, 329.6],
      22: [196, 246.9, 293.7],
      26: [174.6, 220, 293.7],
      30: [196, 246.9, 329.6],
    };
    const chord = chords[step];
    if (chord) {
      for (const f of chord) {
        this.tone(f, 0.14, "triangle", 0.018, t, f, this.musicGain);
      }
    }
    // light melody, sparse and playful
    const melody: Record<number, number> = {
      1: 523.3,
      4: 587.3,
      7: 659.3,
      9: 523.3,
      12: 493.9,
      15: 440,
      17: 392,
      20: 440,
      23: 493.9,
      25: 523.3,
      28: 587.3,
      31: 659.3,
    };
    const note = melody[step];
    if (note) this.tone(note, 0.11, "sine", 0.028, t, note, this.musicGain);
    // brushed snare + hat
    if (step % 4 === 2) this.noise(0.08, 0.02, t, "bandpass", 2200, 0.6, this.musicGain);
    if (step % 2 === 1) this.noise(0.035, 0.014, t, "highpass", 7000, 0.5, this.musicGain);
    // soft kick
    if (step % 8 === 0) this.tone(60, 0.16, "sine", 0.12, t, 40, this.musicGain);
    this.step += 1;
  }
}

export const audio = new AudioEngine();
