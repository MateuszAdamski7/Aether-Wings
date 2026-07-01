class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private volume: number = 0.8;
  
  // Music scheduling
  private schedulerTimer: number | null = null;
  private nextNoteTime: number = 0.0;
  private currentStep: number = 0;
  private bpm: number = 125;
  
  // Master gain
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Track progress
  // Bassline notes (A minor / Synthwave drive)
  // A1 (55Hz), C2 (65.4Hz), F1 (43.6Hz), G1 (49Hz)
  private bassProgression = [
    // A1
    55.00, 55.00, 55.00, 55.00, 55.00, 55.00, 55.00, 55.00,
    55.00, 55.00, 55.00, 55.00, 55.00, 55.00, 55.00, 55.00,
    // F1
    43.65, 43.65, 43.65, 43.65, 43.65, 43.65, 43.65, 43.65,
    // G1
    48.99, 48.99, 48.99, 48.99, 49.00, 49.00, 49.00, 49.00
  ];

  // Chord Progression Pads
  // Am, Am, Fmaj, Gdom
  private chordProgression = [
    [110.00, 130.81, 164.81, 220.00], // Am (A2, C3, E3, A3)
    [110.00, 130.81, 164.81, 220.00], // Am
    [87.31, 110.00, 130.81, 174.61],  // Fmaj (F2, A2, C3, F3)
    [97.99, 123.47, 146.83, 196.00]   // Gmaj (G2, B2, D3, G3)
  ];

  constructor() {
    // Audio context will be initialized on first user click to bypass browser block
  }

  private init() {
    if (this.ctx) return;
    
    // Create audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Create nodes
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    // Connect routing
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Initial volumes
    this.musicGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.sfxGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setVolume(volume: number) {
    this.volume = volume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : volume, this.ctx.currentTime);
    }
  }

  public startMusic() {
    this.init();
    if (this.isPlaying || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.nextNoteTime = this.ctx.currentTime;
    this.currentStep = 0;
    
    // Start loop
    this.scheduler();
  }

  public stopMusic() {
    this.isPlaying = false;
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  private scheduler = () => {
    if (!this.isPlaying || !this.ctx) return;

    // While there are notes to play before the next interval
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.advanceNote();
    }
    
    this.schedulerTimer = window.setTimeout(this.scheduler, 25);
  };

  private advanceNote() {
    // 1 step = a 16th note at 125 BPM
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPerStep = secondsPerBeat / 4.0; 
    
    this.nextNoteTime += secondsPerStep;
    
    // Loop step index through the 32-step grid
    this.currentStep = (this.currentStep + 1) % 32;
  }

  private scheduleNote(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    // 1. Play bass note on 8th notes (steps 0, 2, 4, 6...)
    if (step % 2 === 0) {
      const frequency = this.bassProgression[step];
      this.playBassNote(frequency, time);
    }

    // 2. Play backing pad chord every 8 steps (start of each beat block)
    if (step % 8 === 0) {
      const chordIndex = Math.floor(step / 8);
      const chord = this.chordProgression[chordIndex];
      this.playPadChord(chord, time);
    }

    // 3. Play high retro snare hit on steps 4, 12, 20, 28 (the classic 2 and 4 beats)
    if (step % 8 === 4) {
      this.playSnareHit(time);
    }
    
    // 4. Play hihat ticker on off-steps
    if (step % 4 === 2 || step % 4 === 0) {
      this.playHihat(time);
    }
  }

  // Synthwave driving bass
  private playBassNote(freq: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Bass envelope
    gain.gain.setValueAtTime(0.0, time);
    gain.gain.linearRampToValueAtTime(0.7, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    // Filter envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3, time);
    filter.frequency.exponentialRampToValueAtTime(freq, time + 0.1);
    filter.Q.setValueAtTime(1, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  // Warm chord pad in background
  private playPadChord(freqs: number[], time: number) {
    if (!this.ctx || !this.musicGain) return;

    const duration = 1.8; // Long sustained notes
    
    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.musicGain) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Slightly detune oscillators for lushness
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      osc.detune.setValueAtTime((i - 1.5) * 8, time);

      // Pad envelope: slow attack, long release
      gain.gain.setValueAtTime(0.0, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.linearRampToValueAtTime(1200, time + 0.8);
      filter.frequency.exponentialRampToValueAtTime(400, time + duration);
      filter.Q.setValueAtTime(1, time);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  // White noise snare drum
  private playSnareHit(time: number) {
    if (!this.ctx || !this.musicGain) return;

    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Fill buffer with white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, time);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.15);
  }

  // Hi-hat cymbal
  private playHihat(time: number) {
    if (!this.ctx || !this.musicGain) return;

    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.015, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.04);
  }

  // SFX: Crystal Collect (Fast rising arpeggio)
  public playCollectFx() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const baseFreq = 523.25; // C5
    const notes = [1, 1.25, 1.5, 2.0]; // Major chord ratios (C, E, G, C)

    notes.forEach((ratio, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, now + index * 0.04);

      gain.gain.setValueAtTime(0.0, now + index * 0.04);
      gain.gain.linearRampToValueAtTime(0.15, now + index * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.04 + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + index * 0.04);
      osc.stop(now + index * 0.04 + 0.15);
    });
  }

  // SFX: Collision Crash (Deep exploding boom + noise)
  public playCrashFx() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Noise explosion
    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(400, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(30, now + 0.6);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    // 2. Heavy sub bass drop
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(100, now);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.5);

    subGain.gain.setValueAtTime(0.8, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.8);

    subOsc.start(now);
    subOsc.stop(now + 0.8);
  }

  // SFX: Start game (Swell sound)
  public playStartFx() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.5);

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.85);
  }

  // SFX: Boost Activate (Fast rising siren sweep)
  public playBoostFx() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // SFX: Boost Blast (Sonic boom/blast wave)
  public playBlastFx() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // SFX: Shield Power-Up Pickup (Ascending sine swell)
  public playShieldPickupFx() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // SFX: Shield Shattered (Glass crack white noise + pitch fall)
  public playShieldShatterFx() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.3);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // SFX: Magnet Power-Up Pickup (FM-style vibrating hum)
  public playMagnetPickupFx() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(660, now + 0.4);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(25, now);
    lfoGain.gain.setValueAtTime(15, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.4);
    osc.stop(now + 0.4);
  }

  // SFX: Slow-Mo Clock Pickup (Descending pitch lowpass warp sweep)
  public playSlowMoPickupFx() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.65);

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  // SFX: Mission Completed Chime (Triumphant chord arpeggio)
  public playMissionSuccessFx() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5

    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  }

  // Set music tempo scaling (drop BPM to 80 during slow-mo)
  public setSlowMo(active: boolean) {
    this.bpm = active ? 80 : 125;
  }
}

export const audioManager = new AudioManager();
export default audioManager;
