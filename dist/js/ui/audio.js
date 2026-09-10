let context;
export function playSound(kind, muted) {
  if (muted) return;
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') context.resume();
    const notes =
      kind === 'win'
        ? [392, 494, 587, 784]
        : kind === 'hit'
          ? [330, 660]
          : kind === 'pitch'
            ? [220, 147]
            : [440];
    notes.forEach((frequency, i) => {
      const oscillator = context.createOscillator(),
        gain = context.createGain();
      const start = context.currentTime + i * 0.09;
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.16);
    });
  } catch {
    /* Sound is optional; unsupported audio must never interrupt a run. */
  }
}
