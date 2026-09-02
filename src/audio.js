export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  ensure() {
    if (!this.ctx)
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  toggle() {
    this.muted = !this.muted;
  }
  tone(freq = 220, duration = 0.08, type = "sine", gain = 0.05, slide = 1) {
    if (this.muted) return;
    this.ensure();
    const t = this.ctx.currentTime,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(30, freq * slide),
      t + duration,
    );
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + duration);
  }
  shot() {
    this.tone(540, 0.045, "square", 0.025, 0.7);
  }
  hit() {
    this.tone(120, 0.07, "sawtooth", 0.035, 0.45);
  }
  xp() {
    this.tone(880, 0.05, "sine", 0.02, 1.35);
  }
  level() {
    this.tone(440, 0.18, "triangle", 0.04, 2.2);
  }
  hurt() {
    this.tone(90, 0.12, "sawtooth", 0.05, 0.6);
  }
  boss() {
    this.tone(70, 0.5, "square", 0.05, 1.6);
  }
  manifestation(freq = 220) {
    this.tone(freq, 0.46, "sawtooth", 0.032, 1.8);
    this.tone(freq * 1.5, 0.34, "triangle", 0.026, 1.35);
    this.tone(freq * 2, 0.22, "sine", 0.018, 0.92);
  }
}
