import assert from 'node:assert';
import { describe, it } from 'node:test';

import { formatDayTime, formatDayTime12, formatDayTime24, formatHourLabel } from './utils.js';

describe('formatDayTime', () => {
  it('formats midnight', () => {
    assert.equal(formatDayTime(0), '00:00:00');
  });

  it('truncates fractional seconds', () => {
    assert.equal(formatDayTime(59.9), '00:00:59');
    assert.equal(formatDayTime(3661), '01:01:01');
  });

  it('pads every unit', () => {
    assert.equal(formatDayTime(7 * 3600 + 5 * 60 + 3), '07:05:03');
  });

  it('formats the last second and the end of day', () => {
    assert.equal(formatDayTime(86399), '23:59:59');
    assert.equal(formatDayTime(86400), '24:00:00');
  });

  it('clamps negative values', () => {
    assert.equal(formatDayTime(-10), '00:00:00');
  });
});

describe('formatDayTime12', () => {
  it('formats midnight and noon on the 12-hour clock', () => {
    assert.equal(formatDayTime12(0), '12:00 AM');
    assert.equal(formatDayTime12(12 * 3600), '12:00 PM');
  });

  it('formats morning and afternoon times', () => {
    assert.equal(formatDayTime12(2 * 3600 + 30 * 60), '2:30 AM');
    assert.equal(formatDayTime12(13 * 3600 + 5 * 60), '1:05 PM');
  });

  it('wraps the end of day back to midnight', () => {
    assert.equal(formatDayTime12(86400), '12:00 AM');
  });
});

describe('formatDayTime24', () => {
  it('formats without a leading zero on the hour', () => {
    assert.equal(formatDayTime24(2 * 3600 + 30 * 60), '2:30');
    assert.equal(formatDayTime24(13 * 3600 + 5 * 60), '13:05');
  });
});

describe('formatHourLabel', () => {
  it('labels the day boundaries and afternoon hours', () => {
    assert.equal(formatHourLabel(0), '0:00');
    assert.equal(formatHourLabel(2), '2:00');
    assert.equal(formatHourLabel(13), '13:00');
    assert.equal(formatHourLabel(24), '24:00');
  });
});
