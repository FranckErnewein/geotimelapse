import { expect, test } from 'vitest'
import yMarker from './yMarker'

test('should provide range by 100', () => {
  expect(yMarker(650)).toEqual([100, 200, 300, 400, 500, 600])
})

test('should provide range by 100 on 100', () => {
  expect(yMarker(600)).toEqual([100, 200, 300, 400, 500, 600])
})

test('should provide range by 1', () => {
  expect(yMarker(3)).toEqual([1, 2, 3])
})
test('should provide range by 9', () => {
  expect(yMarker(9)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
})
test('should provide range [1,2] for 1', () => {
  expect(yMarker(1)).toEqual([1, 2])
})
test('should provide range [1,2] for 0', () => {
  expect(yMarker(0)).toEqual([1, 2])
})
test('should provide range [100] for 101', () => {
  expect(yMarker(101)).toEqual([100])
})
test('should provide range [100] for 100', () => {
  expect(yMarker(100)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
})
