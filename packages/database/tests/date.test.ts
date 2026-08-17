import { describe, it, expect } from 'vitest';
import { calculateLeaveDays, isValidDateRange } from '../src/lib/dates';

describe('Date Logic & Math', () => {
  describe('calculateLeaveDays', () => {
    it('should return exactly 1 day for same-day leave', () => {
      const start = new Date('2026-08-17');
      const end = new Date('2026-08-17');
      expect(calculateLeaveDays(start, end)).toBe(1);
    });

    it('should accurately calculate multi-day leave', () => {
      const start = new Date('2026-08-17');
      const end = new Date('2026-08-20');
      expect(calculateLeaveDays(start, end)).toBe(4);
    });

    it('should handle time components correctly (stripping time)', () => {
      const start = new Date('2026-08-17T23:59:59Z');
      const end = new Date('2026-08-17T00:00:00Z');
      expect(calculateLeaveDays(start, end)).toBe(1);
    });
  });

  describe('isValidDateRange', () => {
    it('should be valid if start equals end', () => {
      const start = new Date('2026-08-17');
      const end = new Date('2026-08-17');
      expect(isValidDateRange(start, end)).toBe(true);
    });

    it('should be valid if start is before end', () => {
      const start = new Date('2026-08-17');
      const end = new Date('2026-08-18');
      expect(isValidDateRange(start, end)).toBe(true);
    });

    it('should be invalid if end is before start', () => {
      const start = new Date('2026-08-18');
      const end = new Date('2026-08-17');
      expect(isValidDateRange(start, end)).toBe(false);
    });

    it('should be invalid for invalid Date objects', () => {
      const start = new Date('invalid');
      const end = new Date('2026-08-17');
      expect(isValidDateRange(start, end)).toBe(false);
    });
  });
});
