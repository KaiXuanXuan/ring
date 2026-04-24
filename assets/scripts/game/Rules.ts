/**
 * Core Game Rules
 *
 * Pure functions for all gameplay judgments.
 * Only entry point for rule definitions.
 */

import { RingState, BombState, BuckleConfig, FIXED_GAP_SIZE, RELEASE_TOLERANCE } from './Types';

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

  // 先检查“本 Ring 自身的 Buckle”是否都已对齐到 linkedRing 的缺口
  const ownBuckles = bucklesByRing.get(ringState.id) || [];
  for (const buckle of ownBuckles) {
    if (!buckle.linkedRingId) continue;
    const linkedRing = allRings.get(buckle.linkedRingId);
    if (!linkedRing || linkedRing.isReleased) continue;

    if (!isBuckleAlignedWithRingGap(ringState, buckle.angle, linkedRing)) {
      return false;
    }
  }

  for (const [id, otherRing] of allRings) {
    if (id === ringState.id || otherRing.isReleased) continue;

    const buckles = bucklesByRing.get(otherRing.id) || [];
    for (const buckle of buckles) {
      // 只检查连接到要释放 Ring 的 Buckle
      if (buckle.linkedRingId !== ringState.id) continue;

      if (!isBuckleAlignedWithRingGap(otherRing, buckle.angle, ringState)) {
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

/**
 * 获取与指定 Ring 通过 Buckle 连接的所有 Ring ID
 */
export function getLinkedRingIds(
  ringId: string,
  bucklesByRing: Map<string, BuckleConfig[]>
): string[] {
  const linkedIds: string[] = [];

  // 查找所有 Ring 上的 Buckle，看哪些连接到了指定 Ring
  for (const [ownerRingId, buckles] of bucklesByRing) {
    for (const buckle of buckles) {
      if (buckle.linkedRingId === ringId) {
        linkedIds.push(ownerRingId);
      }
    }
  }

  // 查找指定 Ring 上的 Buckle，看它们连接到哪些 Ring
  const buckles = bucklesByRing.get(ringId) || [];
  for (const buckle of buckles) {
    if (buckle.linkedRingId) {
      linkedIds.push(buckle.linkedRingId);
    }
  }

  return linkedIds;
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

function isBuckleAlignedWithRingGap(
  buckleOwnerRing: RingState,
  buckleRelativeAngle: number,
  gapOwnerRing: RingState
): boolean {
  const buckleAngle = wrapDeg(buckleOwnerRing.currentAngle + buckleRelativeAngle);
  const gapStart = wrapDeg(gapOwnerRing.currentAngle);
  const gapEnd = (gapStart + FIXED_GAP_SIZE) % 360;

  // 使用容差放宽判定：Gap 范围扩大容差
  const gapStartTolerant = (gapStart - RELEASE_TOLERANCE + 360) % 360;
  const gapEndTolerant = (gapEnd + RELEASE_TOLERANCE) % 360;
  return isAngleInRange(buckleAngle, gapStartTolerant, gapEndTolerant);
}

function wrapDeg(a: number): number {
  const m = a % 360;
  return m < 0 ? m + 360 : m;
}

