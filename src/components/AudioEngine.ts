/**
 * Procedural Audio Engine for Tabletop Chess App
 * Synthesizes organic wooden sounds and ambient noise using Web Audio API
 */

class AudioEngineClass {
  private ctx: AudioContext | null = null;
  private isAmbiencePlaying: boolean = false;
  private ambienceNodes: { osc: OscillatorNode; filter: BiquadFilterNode; gain: GainNode }[] = [];
  private ambientLfo: OscillatorNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Synthesizes a dry, resonant wooden cabinet click (Move)
   */
  public playMove() {
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    
    // Core click oscillator (high wood frequency)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, time);
    osc.frequency.exponentialRampToValueAtTime(150, time + 0.08);

    // Filter to give wood resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, time);
    filter.Q.setValueAtTime(3.5, time);

    // Gain envelope (very snappy)
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    // Connect
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    // Secondary sub-impact (thump of board)
    const thump = this.ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(90, time);
    thump.frequency.exponentialRampToValueAtTime(40, time + 0.15);

    const thumpGain = this.ctx.createGain();
    thumpGain.gain.setValueAtTime(0.4, time);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    thump.connect(thumpGain);
    thumpGain.connect(this.ctx.destination);

    // Fire!
    osc.start(time);
    osc.stop(time + 0.15);
    thump.start(time);
    thump.stop(time + 0.25);
  }

  /**
   * Synthesizes a double, slightly louder wooden capture clack with higher timber
   */
  public playCapture() {
    this.initCtx();
    if (!this.ctx) return;

    // A capture is two tight wooden impacts back-to-back to simulate sliding/knocking
    const time = this.ctx.currentTime;

    // Dynamic clack 1
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(520, time);
    osc1.frequency.exponentialRampToValueAtTime(200, time + 0.06);

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(420, time);
    filter1.Q.setValueAtTime(4, time);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.4, time);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.ctx.destination);

    // Dynamic clack 2 (delayed by 40ms)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(480, time + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(140, time + 0.13);

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(360, time + 0.04);
    filter2.Q.setValueAtTime(3, time + 0.04);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.0, time);
    gain2.gain.setValueAtTime(0.35, time + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(this.ctx.destination);

    // Deep heavy board resonance rumble
    const rumble = this.ctx.createOscillator();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(110, time);
    rumble.frequency.exponentialRampToValueAtTime(50, time + 0.25);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.5, time);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);

    // Start
    osc1.start(time);
    osc1.stop(time + 0.1);
    osc2.start(time + 0.04);
    osc2.stop(time + 0.2);
    rumble.start(time);
    rumble.stop(time + 0.35);
  }

  /**
   * Play check/checkmate warning bell (warm, non-intrusive wooden chime)
   */
  public playCheck() {
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    
    // Chord of 3 frequencies
    const freqs = [330, 440, 550]; // Beautiful organic chime
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      const gainNode = this.ctx!.createGain();
      // stagger entry slightly
      gainNode.gain.setValueAtTime(0.0, time);
      gainNode.gain.linearRampToValueAtTime(0.15, time + idx * 0.02 + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.8 + idx * 0.1);

      osc.connect(gainNode);
      gainNode.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + 1.5);
    });
  }

  /**
   * Synthesize a snappy, incredibly subtle vintage wooden clock escapement tick
   */
  public playTick() {
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    
    // Very fast dry tick (noise burst formatted with filter)
    const bufSize = this.ctx.sampleRate * 0.02; // extremely short 20ms burst
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1800, time); // high wood-clock click
    bandpass.Q.setValueAtTime(10, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.018);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(time);
    noise.stop(time + 0.03);
  }

  /**
   * Starts an immersive ambient chess-hall / warm parlor wood tabletop hum
   */
  public startAmbience() {
    this.initCtx();
    if (!this.ctx || this.isAmbiencePlaying) return;

    this.isAmbiencePlaying = true;
    const time = this.ctx.currentTime;

    // Create low brownian noise hum/rumble (recreates a warm, quiet indoor acoustic parlor)
    const nodesCount = 3;
    this.ambienceNodes = [];

    // Synthesize low acoustic warmth
    for (let i = 0; i < nodesCount; i++) {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Low subsonic frequencies that weave past each other
      const baseFreq = 55 + i * 22.3;
      osc.frequency.setValueAtTime(baseFreq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, time);

      gain.gain.setValueAtTime(0.0, time);
      // Fade in gently
      gain.gain.linearRampToValueAtTime(0.08, time + 3.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);

      this.ambienceNodes.push({ osc, filter, gain });
    }

    // Gentle LFO to shift ambient density, simulating a shifting room
    this.ambientLfo = this.ctx.createOscillator();
    this.ambientLfo.frequency.setValueAtTime(0.15, time); // VERY slow, 6 seconds period
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(15, time);

    this.ambientLfo.connect(lfoGain);

    this.ambienceNodes.forEach((node, index) => {
      lfoGain.connect(node.osc.frequency);
    });

    this.ambientLfo.start(time);
  }

  /**
   * Stops ambient sound
   */
  public stopAmbience() {
    if (!this.isAmbiencePlaying) return;

    const time = this.ctx ? this.ctx.currentTime : 0;
    
    // Fade out gently to avoid popping
    this.ambienceNodes.forEach(node => {
      if (this.ctx) {
        node.gain.gain.cancelScheduledValues(time);
        node.gain.gain.setValueAtTime(node.gain.gain.value, time);
        node.gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.5);
        setTimeout(() => {
          try {
            node.osc.stop();
            node.osc.disconnect();
            node.filter.disconnect();
            node.gain.disconnect();
          } catch(e) {}
        }, 2000);
      }
    });

    if (this.ambientLfo) {
      try {
        this.ambientLfo.stop();
        this.ambientLfo.disconnect();
      } catch(e) {}
    }

    this.ambienceNodes = [];
    this.ambientLfo = null;
    this.isAmbiencePlaying = false;
  }

  public toggleAmbience() {
    if (this.isAmbiencePlaying) {
      this.stopAmbience();
    } else {
      this.startAmbience();
    }
    return this.isAmbiencePlaying;
  }

  public getAmbienceStatus(): boolean {
    return this.isAmbiencePlaying;
  }
}

export const AudioEngine = new AudioEngineClass();
export default AudioEngine;
