import { describe, it, expect } from 'vitest';
import {
  pointSegmentDistanceSq,
  segmentSegmentDistanceSq,
  segmentsIntersect,
} from '../src/sim/collision';

describe('pointSegmentDistanceSq', () => {
  it('is the perpendicular distance when the foot lands on the segment', () => {
    expect(pointSegmentDistanceSq(0, 5, -10, 0, 10, 0)).toBeCloseTo(25);
  });

  it('clamps to the nearest endpoint when the foot is past the end', () => {
    expect(pointSegmentDistanceSq(20, 0, -10, 0, 10, 0)).toBeCloseTo(100);
  });

  it('is zero for a point lying on the segment', () => {
    expect(pointSegmentDistanceSq(3, 0, -10, 0, 10, 0)).toBeCloseTo(0);
  });

  it('handles a degenerate (zero-length) segment', () => {
    expect(pointSegmentDistanceSq(3, 4, 0, 0, 0, 0)).toBeCloseTo(25);
  });
});

describe('segmentSegmentDistanceSq', () => {
  it('is zero for crossing segments', () => {
    expect(segmentsIntersect(-5, 0, 5, 0, 0, -5, 0, 5)).toBe(true);
    expect(segmentSegmentDistanceSq(-5, 0, 5, 0, 0, -5, 0, 5)).toBeCloseTo(0);
  });

  it('is the gap squared for parallel offset segments', () => {
    expect(segmentSegmentDistanceSq(0, 0, 10, 0, 0, 3, 10, 3)).toBeCloseTo(9);
  });

  it('uses nearest endpoints for a disjoint collinear gap', () => {
    expect(segmentSegmentDistanceSq(0, 0, 1, 0, 5, 0, 6, 0)).toBeCloseTo(16);
  });
});
