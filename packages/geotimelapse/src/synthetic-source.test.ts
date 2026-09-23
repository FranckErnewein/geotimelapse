import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createSyntheticSource } from './synthetic-source.js';

test('a seed fully determines the day', async () => {
  const first = createSyntheticSource({ total: 5_000, seed: 7 });
  const second = createSyntheticSource({ total: 5_000, seed: 7 });
  await first.load();
  await second.load();
  const [frameA, frameB] = await Promise.all([first.frame(0, 86_400), second.frame(0, 86_400)]);
  assert.deepEqual(frameA.positions, frameB.positions);
  assert.deepEqual(frameA.weights, frameB.weights);
  await first.dispose();
  await second.dispose();
});

test('totals accumulate to the requested volume', async () => {
  const source = createSyntheticSource({ total: 5_000, seed: 42 });
  await source.load();
  assert.deepEqual(await source.totals(0), { count: 0, value: 0 });
  assert.deepEqual(await source.totals(86_400), { count: 5_000, value: 5_000 });
  await source.dispose();
});

test('the day mixes clusters, fog and geometric point stacks', async () => {
  const source = createSyntheticSource({ total: 10_000, seed: 42 });
  await source.load();
  const day = await source.frame(0, 86_400);
  const weightSum = Array.from(day.weights).reduce((sum, weight) => sum + weight, 0);
  assert.equal(weightSum, 10_000);
  const stacks = Array.from(day.weights)
    .filter((weight) => weight > 1)
    .sort((a, b) => b - a);
  assert.equal(stacks.length, 5);
  for (let i = 1; i < stacks.length; i++) {
    const ratio = stacks[i - 1] / stacks[i];
    assert.ok(ratio > 1.4 && ratio < 2.8, `stack ratio ${ratio}`);
  }
  await source.dispose();
});

test('setScope filters the reads and null restores them', async () => {
  const source = createSyntheticSource({ total: 5_000, seed: 42 });
  await source.load();
  const world = await source.totals(86_400);

  await source.setScope({ west: -100, south: 24.5, east: -66.9, north: 49.4 });
  const east = await source.totals(86_400);
  assert.ok(east.count > 0 && east.count < world.count);
  const activity = await source.activity();
  const activitySum = Array.from(activity).reduce((sum, count) => sum + count, 0);
  assert.equal(activitySum, east.count);

  await source.setScope(null);
  assert.deepEqual(await source.totals(86_400), world);
  await source.dispose();
});
