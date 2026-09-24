/**
 * Web Audio PC Speaker Synthesizer for Turbo C++ Mobile
 * Simulates the Intel 8253 PIT / PC Speaker and Sound Blaster output
 * Credits: ENCRYPTED CREW
 */

class PcSpeakerEngine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private isEnabled: boolean = true;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0.08; // Safe, comfortable volume
        this.gain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.nosound();
    }
  }

  /**
   * Mechanical key click audio pulse
   */
  public click() {
    if (!this.isEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.gain) return;

      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(800, this.ctx.currentTime);
      clickOsc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.015);

      clickGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.015);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);

      clickOsc.start();
      clickOsc.stop(this.ctx.currentTime + 0.016);
    } catch {
      // Audio context might fail on un-interacted touch
    }
  }

  /**
   * DOS dos.h sound(int freq)
   */
  public sound(frequency: number) {
    if (!this.isEnabled || frequency <= 0) return;
    try {
      this.initContext();
      if (!this.ctx || !this.gain) return;

      if (!this.osc) {
        this.osc = this.ctx.createOscillator();
        this.osc.type = 'square'; // Authentic PC speaker 1-bit timer square wave
        this.osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        this.osc.connect(this.gain);
        this.osc.start();
      } else {
        this.osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      }
    } catch {
      // Audio context might fail on un-interacted touch
    }
  }

  /**
   * DOS dos.h nosound()
   */
  public nosound() {
    if (this.osc) {
      try {
        this.osc.stop();
        this.osc.disconnect();
      } catch {
        // Ignored
      }
      this.osc = null;
    }
  }

  /**
   * DOS dos.h sound + delay sequence
   */
  public async beep(frequency: number, durationMs: number): Promise<void> {
    if (!this.isEnabled) return;
    this.sound(frequency);
    await new Promise(resolve => setTimeout(resolve, durationMs));
    this.nosound();
  }

  /**
   * Short tactile click sound for touch keyboard keys
   */
  public playKeyClick() {
    if (!this.isEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.gain) return;

      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();

      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(700, this.ctx.currentTime);
      clickOsc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.015);

      clickGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.015);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);

      clickOsc.start();
      clickOsc.stop(this.ctx.currentTime + 0.015);
    } catch {
      // Audio not allowed yet
    }
  }
}

export const pcSpeaker = new PcSpeakerEngine();
