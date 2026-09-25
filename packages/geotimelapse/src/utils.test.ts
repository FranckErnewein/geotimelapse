import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  domainTicks,
  formatDayTime,
  formatDayTime12,
  formatDayTime24,
  formatHover,
  formatHourLabel,
  formatPlayhead,
} from './utils.js';

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

const DAY = 24 * 3600;
const JAN_2023 = new Date(2023, 0, 1);

describe('domainTicks', () => {
  it('keeps the hourly axis for a day span', () => {
    const ticks = domainTicks({ start: null, spanSeconds: DAY });
    assert.equal(ticks.length, 25);
    assert.equal(ticks[0].label, '0:00');
    assert.equal(ticks[1].label, null);
    assert.equal(ticks[2].label, '2:00');
    assert.equal(ticks[24].label, '24:00');
  });

  it('ticks anchored days for a month span', () => {
    const ticks = domainTicks({ start: JAN_2023, spanSeconds: 31 * DAY });
    assert.equal(ticks.length, 30);
    assert.equal(ticks[0].label, 'Jan 2');
    assert.equal(ticks[1].label, null);
    assert.ok(ticks.every((tick) => tick.fraction > 0 && tick.fraction < 1));
  });

  it('ticks month starts for a year span', () => {
    const ticks = domainTicks({ start: JAN_2023, spanSeconds: 365 * DAY });
    assert.equal(ticks.length, 11);
    assert.equal(ticks[0].label, 'Feb');
    assert.equal(ticks[10].label, 'Dec');
  });

  it('falls back to elapsed days without an anchor', () => {
    const ticks = domainTicks({ start: null, spanSeconds: 10 * DAY });
    assert.equal(ticks[0].label, 'd0');
    assert.equal(ticks.at(-1)?.label, 'd10');
  });
});

describe('formatPlayhead', () => {
  it('keeps clock time for a day span', () => {
    assert.equal(formatPlayhead(9 * 3600, { start: null, spanSeconds: DAY }), '9:00 AM');
  });

  it('speaks calendar dates on anchored long spans', () => {
    assert.equal(formatPlayhead(13.5 * DAY, { start: JAN_2023, spanSeconds: 31 * DAY }), 'Jan 14, 12 PM');
    assert.equal(formatPlayhead(45 * DAY, { start: JAN_2023, spanSeconds: 365 * DAY }), 'Feb 15');
  });

  it('speaks elapsed days on unanchored long spans', () => {
    assert.equal(formatPlayhead(13.5 * DAY, { start: null, spanSeconds: 31 * DAY }), 'day 14, 12:00');
  });
});

describe('formatHover', () => {
  it('stays compact on a day span', () => {
    assert.equal(formatHover(13 * 3600 + 300, { start: null, spanSeconds: DAY }), '13:05');
  });

  it('adds the day on anchored long spans', () => {
    assert.equal(formatHover(13.5 * DAY, { start: JAN_2023, spanSeconds: 31 * DAY }), 'Jan 14, 12:00');
  });
});
