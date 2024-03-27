import { expect, test } from 'vitest'
import dayRange from './dayRange'

test('should fill the range', () => {
  expect(dayRange('2000-01-01', '2000-01-04')).toEqual([
    '2000-01-01',
    '2000-01-02',
    '2000-01-03',
    '2000-01-04',
  ])
})
test('should handle date with space', () => {
  expect(dayRange('2000-01-01 12:45:34', '2000-01-04 04:32:12')).toEqual([
    '2000-01-01',
    '2000-01-02',
    '2000-01-03',
    '2000-01-04',
  ])
})
test('should raise error because end is before start', () => {
  expect(() => dayRange('2000-01-04', '2000-01-01')).toThrow()
})
test('should raise error because end is not valid', () => {
  expect(() => dayRange('2000-01-04', 'invalid date')).toThrow()
})
test('should raise error because end is not valid', () => {
  expect(() => dayRange('invalid date', '2000-01-04')).toThrow()
})
