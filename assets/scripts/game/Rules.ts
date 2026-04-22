/**
 * Core Game Rules
 *
 * Pure functions for all gameplay judgments.
 * Only entry point for rule definitions.
 */

import { RingState, BombState, BuckleConfig, FIXED_GAP_SIZE } from './Types';

export function isRingConstrained(
  ringState: RingState,
  allRings: Map<string, RingState>,
  bucklesByRing: Map<string, BuckleConfig[]>
): boolean {
  if (ringState.isReleased) return false;

  const buckles = bucklesByRing.get(ringState.id) || [];
  for (const buckle of buckles) {
    if (!buckle.linkedRingId) continue;

    const linkedRing = allRings.get(buckle.linkedRingId);
    if (!linkedRing || linkedRing.isReleased) continue;
    return true;
  }

  return false;
}

export function canRingRotate(
  ringState: RingState,
  allRings: Map<string, RingState>,
  bucklesByRing: Map<string, BuckleConfig[]>
): boolean {
  if (ringState.isReleased) return false;
  if (ringState.hasRock) return false;
  if (isRingConstrained(ringState, allRings, bucklesByRing)) return false;
  return true;
}

export function canRingRelease(
  ringState: RingState,
  allRings: Map<string, RingState>,
  bucklesByRing: Map<string, BuckleConfig[]>
): boolean {
  if (ringState.isReleased) return false;
  if (isRingConstrained(ringState, allRings, bucklesByRing)) return false;

  for (const [id, otherRing] of allRings) {
    if (id === ringState.id || otherRing.isReleased) continue;

    const buckles = bucklesByRing.get(otherRing.id) || [];
    for (const buckle of buckles) {
      const buckleAngle = wrapDeg(otherRing.currentAngle + buckle.angle);
      const gapStart = wrapDeg(ringState.currentAngle);
      const gapEnd = (gapStart + FIXED_GAP_SIZE) % 360;

      if (!isAngleInRange(buckleAngle, gapStart, gapEnd)) {
        return false;
      }
    }
  }

  return true;
}

export function shouldBombExplodeOnRelease(
  bombState: BombState,
  ringId: string
): boolean {
  if (bombState.isExploded) return false;
  return ringId === bombState.config.ringId;
}

function isAngleInRange(
  angle: number,
  start: number,
  end: number
): boolean {
  const normalizedAngle = angle < 0 ? angle + 360 : angle % 360;
  const normalizedStart = start < 0 ? start + 360 : start % 360;
  const normalizedEnd = end < 0 ? end + 360 : end % 360;

  if (normalizedStart <= normalizedEnd) {
    return normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd;
  } else {
    return normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd;
  }
}

function wrapDeg(a: number): number {
  const m = a % 360;
  return m < 0 ? m + 360 : m;
}

