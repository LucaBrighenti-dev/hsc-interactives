// Optional sound for the Doppler and beats setup, through WebAudio. It only starts when the teacher
// turns on "Play sound" (a click on the control); the engine forces it off when a page loads, so it
// never plays by itself. Everything else works the same with it off or with no WebAudio at all.

const LEVEL = 0.12; // master gain: quiet
const GLIDE = 0.03; // s, time constant for frequency and level changes (no clicks)

export function createAudio() {
  const AC = typeof window === 'undefined' ? null : window.AudioContext || window.webkitAudioContext || null;
  let ctx = null;
  let master = null;
  let voices = [];

  function ensure() {
    if (!AC) return false;
    if (!ctx) {
      // Only a real click or key press may start sound (transient user activation), never a script or a link.
      const activation = typeof navigator === 'undefined' ? null : navigator.userActivation;
      if (activation && !activation.isActive) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return true;
  }

  function stopVoices(at) {
    for (const v of voices) {
      try {
        v.osc.stop(at);
      } catch {
        /* already stopped */
      }
    }
    voices = [];
  }

  return {
    /** Play these frequencies (Hz) together, replacing what was playing. */
    play(freqs) {
      if (!ensure()) return;
      const now = ctx.currentTime;
      if (voices.length !== freqs.length) {
        stopVoices(now + 0.05);
        voices = freqs.map(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          gain.gain.value = 1 / freqs.length;
          osc.connect(gain).connect(master);
          osc.start(now);
          return { osc, gain };
        });
      }
      freqs.forEach((f, i) => voices[i].osc.frequency.setTargetAtTime(f, now, GLIDE));
      master.gain.setTargetAtTime(LEVEL, now, GLIDE);
    },
    stop() {
      if (!ctx || !voices.length) return;
      const now = ctx.currentTime;
      master.gain.setTargetAtTime(0, now, GLIDE);
      stopVoices(now + 0.3);
    },
    isPlaying: () => voices.length > 0,
    destroy() {
      if (!ctx) return;
      stopVoices(ctx.currentTime);
      ctx.close().catch(() => {});
      ctx = null;
    },
  };
}
