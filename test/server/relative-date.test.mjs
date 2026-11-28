// `relativeDate` — reference/spec/03-backend.md §5 (`community-post`):
// "displayed relative ("6d", "3w", then `MMM D`) computed at render time".
import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { relativeDate } from '../../lib/relative-date.js';

const NOW = new Date('2026-06-15T12:00:00Z');

function daysBefore(days) {
  const date = new Date(NOW);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

describe('relativeDate', () => {
  it('counts the last week in days', () => {
    assert.equal(relativeDate(daysBefore(0), NOW), '0d');
    assert.equal(relativeDate(daysBefore(6), NOW), '6d');
  });

  it('counts up to 29 days in whole weeks', () => {
    assert.equal(relativeDate(daysBefore(7), NOW), '1w');
    assert.equal(relativeDate(daysBefore(20), NOW), '2w');
    assert.equal(relativeDate(daysBefore(29), NOW), '4w');
  });

  it('shows the month and day from 30 days on', () => {
    assert.equal(relativeDate(daysBefore(30), NOW), 'May 16');
    assert.equal(relativeDate(daysBefore(60), NOW), 'Apr 16');
  });

  it('adds the year when the post is from another year', () => {
    assert.equal(relativeDate(daysBefore(400), NOW), 'May 11, 2025');
  });

  it('reads a date-only string as UTC and accepts a Date', () => {
    assert.equal(relativeDate('2026-06-09', NOW), '6d');
    assert.equal(relativeDate(new Date('2026-06-09T23:00:00Z'), NOW), '6d');
  });

  it('treats a future date as today and an unreadable date as empty', () => {
    assert.equal(relativeDate(daysBefore(-3), NOW), '0d');
    assert.equal(relativeDate('not a date', NOW), '');
  });
});
