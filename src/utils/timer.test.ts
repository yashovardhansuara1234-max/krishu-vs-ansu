import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTimeDifference, formatTimeDisplay, padZero } from './timer.ts';

test('padZero formats single and double digits properly', () => {
  assert.equal(padZero(0), '00');
  assert.equal(padZero(5), '05');
  assert.equal(padZero(12), '12');
  assert.equal(padZero(99), '99');
});

test('calculateTimeDifference computes accurate countdown for future date', () => {
  const now = new Date('2026-10-16T12:00:00Z');
  const target = '2026-10-20T00:00:00Z';
  const result = calculateTimeDifference(target, now);
  
  assert.equal(result.isPast, false);
  // Difference between Oct 16 12:00 and Oct 20 00:00 is 3 days + 12 hours = 84 hours
  assert.equal(result.days, 3);
  assert.equal(result.hours, 12);
  assert.equal(result.minutes, 0);
  assert.equal(result.seconds, 0);
  
  const formatted = formatTimeDisplay(result);
  assert.equal(formatted.days, '03');
  assert.equal(formatted.hours, '12');
  assert.equal(formatted.minutes, '00');
  assert.equal(formatted.seconds, '00');
});

test('calculateTimeDifference handles countup when birthday has passed', () => {
  const now = new Date('2026-10-21T01:30:15Z');
  const target = '2026-10-20T00:00:00Z';
  const result = calculateTimeDifference(target, now);
  
  assert.equal(result.isPast, true);
  // Difference is 1 day, 1 hour, 30 min, 15 sec
  assert.equal(result.days, 1);
  assert.equal(result.hours, 1);
  assert.equal(result.minutes, 30);
  assert.equal(result.seconds, 15);
});
