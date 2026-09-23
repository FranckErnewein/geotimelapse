import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildGlowLayers, DEFAULT_GLOW_TUNING } from './glow-layer.js';
import type { FrameBids } from './hooks.js';

function frame(key: number): FrameBids {
  return { key, positions: new Float32Array([0, 0]), radii: new Float32Array([1]), count: 1, queryMs: 0 };
}

const fillAlpha = (layer: ReturnType<typeof buildGlowLayers>[number]) =>
  (layer.props.getFillColor as unknown as number[])[3];

test('layer ids are stable ring-buffer slots', () => {
  const layers = buildGlowLayers([frame(14), frame(13), frame(12)]);
  assert.deepEqual(
    layers.map((layer) => layer.id),
    ['glow-2', 'glow-1', 'glow-0'],
  );
});

test('radii taper with age from the flash down to the ghost floor', () => {
  const frames = Array.from({ length: DEFAULT_GLOW_TUNING.trailFrames }, (_, age) => frame(23 - age));
  const scales = buildGlowLayers(frames).map((layer) => layer.props.radiusScale);
  assert.equal(scales[0], DEFAULT_GLOW_TUNING.flashRadius);
  assert.equal(scales[1], DEFAULT_GLOW_TUNING.ghostMaxRadius);
  assert.equal(scales.at(-1), DEFAULT_GLOW_TUNING.ghostMinRadius);
  for (let age = 2; age < scales.length; age++) assert.ok(scales[age] < scales[age - 1]);
});

test('the pixel floor tapers with the same ratio as the radius', () => {
  const layers = buildGlowLayers([frame(1), frame(0)]);
  const { minRadiusPx, flashRadius, ghostMaxRadius } = DEFAULT_GLOW_TUNING;
  assert.equal(layers[0].props.radiusMinPixels, minRadiusPx);
  assert.equal(layers[1].props.radiusMinPixels, (minRadiusPx * ghostMaxRadius) / flashRadius);
});

test('ghosts fade geometrically in the fill alpha', () => {
  const frames = Array.from({ length: 3 }, (_, age) => frame(2 - age));
  const alphas = buildGlowLayers(frames).map(fillAlpha);
  assert.equal(alphas[0], DEFAULT_GLOW_TUNING.pointAlpha);
  assert.equal(alphas[1], Math.round(DEFAULT_GLOW_TUNING.pointAlpha * 0.8));
  assert.equal(alphas[2], Math.round(DEFAULT_GLOW_TUNING.pointAlpha * 0.8 ** 2));
});

test('tuning overrides reach the layers', () => {
  const [layer] = buildGlowLayers([frame(0)], { ...DEFAULT_GLOW_TUNING, pointAlpha: 50, maxRadiusPx: 42 });
  assert.equal(fillAlpha(layer), 50);
  assert.equal(layer.props.radiusMaxPixels, 42);
  assert.equal(layer.props.radiusUnits, 'meters');
});
