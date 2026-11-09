/** Pure device-orientation transforms. No sensor access happens in this module. */
export function clampTilt(value, low, high) { return Math.max(low, Math.min(high, value)); }

export function angularDelta(next, baseline) {
  if (!Number.isFinite(next) || !Number.isFinite(baseline)) return 0;
  return ((next - baseline + 540) % 360) - 180;
}

/** Relative sensor rotation, mapped for portrait and both landscape orientations. */
export function computeTiltOffset(reading, baseline, screenAngle = 0) {
  if (!reading || !baseline) return { x: 0, y: 0 };
  const pitch = clampTilt(angularDelta(reading.beta, baseline.beta), -28, 28);
  const roll = clampTilt(angularDelta(reading.gamma, baseline.gamma), -28, 28);
  const angle = ((screenAngle % 360) + 360) % 360;
  let x = roll; let y = pitch;
  if (angle === 90) { x = pitch; y = -roll; }
  else if (angle === 270) { x = -pitch; y = roll; }
  else if (angle === 180) { x = -roll; y = -pitch; }
  return { x: clampTilt(x * 0.048, -1.28, 1.28), y: clampTilt(y * 0.032, -0.85, 0.85) };
}
