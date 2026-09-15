import { ScatterplotLayer } from 'deck.gl';

import type { FrameBids } from './hooks.js';

// ScatterplotLayer with the disc fill replaced by a point light: a ~1px core
// plus an inverse-square halo. Rendered additively (see GLOW_PARAMETERS), so
// stacked points accumulate into a bloom that reveals density.
const fs = /* glsl */ `\
#version 300 es
#define SHADER_NAME glow-layer-fragment-shader

precision highp float;

in vec4 vFillColor;
in vec2 unitPosition;
in float outerRadiusPixels;

out vec4 fragColor;

void main(void) {
  geometry.uv = unitPosition;

  float distPixels = length(unitPosition) * outerRadiusPixels;
  float core = smoothstep(1.4, 0.3, distPixels);
  // Gaussian halo: a soft, wide shoulder instead of a spiky falloff, with a
  // per-point amplitude low enough that white needs hundreds of stacked
  // points — that slow additive build-up is what reads as glow.
  float sigma = outerRadiusPixels * 0.35;
  float halo = 0.035 * exp(-distPixels * distPixels / (2.0 * sigma * sigma));
  // The core reads pure white; the halo carries the fill color's tint.
  vec3 color = mix(vFillColor.rgb, vec3(1.0), core);
  fragColor = vec4(color, vFillColor.a * min(core + halo, 1.0));

  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

export default class GlowLayer<DataT> extends ScatterplotLayer<DataT> {
  static layerName = 'GlowLayer';

  getShaders() {
    return { ...super.getShaders(), fs };
  }
}

// Additive blending: overlapping halos sum toward white instead of occluding.
export const GLOW_PARAMETERS = {
  blendColorOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one',
  blendAlphaOperation: 'add',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one',
} as const;

/** The visual knobs of the glow trail. */
export interface GlowTuning {
  /** Master per-point transparency, 0-255: density does the brightening. */
  pointAlpha: number;
  /** Halo tint; the shader keeps the point core pure white. */
  haloTint: [number, number, number];
  /** Radius of the freshest frame's points, in pixels (per unit of weight). */
  flashRadius: number;
  /** Ghost radii taper linearly from this down to ghostMinRadius. */
  ghostMaxRadius: number;
  ghostMinRadius: number;
  /** How many past frames stay visible as fading ghosts. */
  trailFrames: number;
}

export const DEFAULT_GLOW_TUNING: GlowTuning = {
  pointAlpha: 115,
  haloTint: [190, 222, 255],
  flashRadius: 15,
  ghostMaxRadius: 10,
  ghostMinRadius: 1,
  trailFrames: 12,
};

function radiusForAge(age: number, tuning: GlowTuning): number {
  if (age === 0) return tuning.flashRadius;
  const taper = (age - 1) / Math.max(tuning.trailFrames - 2, 1);
  return tuning.ghostMaxRadius - (tuning.ghostMaxRadius - tuning.ghostMinRadius) * taper;
}

/**
 * One layer per remembered frame, fading and tightening with age into a ghost
 * trail. The layer id is the frame's ring-buffer slot: a slot's data only
 * changes when its frame rotates out, so per tick a single layer re-uploads
 * attributes. Pure: same frames + tuning, same layers.
 */
export function buildGlowLayers(frames: FrameBids[], tuning: GlowTuning = DEFAULT_GLOW_TUNING): GlowLayer<unknown>[] {
  return frames.map(
    (frame, age) =>
      new GlowLayer({
        id: `glow-${frame.key % tuning.trailFrames}`,
        data: {
          length: frame.count,
          attributes: {
            // sqrt(weight) radii: point AREA stays linear in the weight.
            getPosition: { value: frame.positions, size: 2 },
            getRadius: { value: frame.radii, size: 1 },
          },
        },
        getFillColor: [...tuning.haloTint, tuning.pointAlpha],
        // Fill-rate is the frame budget: cost grows with the quad area (r²),
        // so ghost frames shrink with age — the glow cools as it fades.
        radiusScale: radiusForAge(age, tuning),
        radiusUnits: 'pixels',
        stroked: false,
        opacity: Math.max((tuning.trailFrames - age) / tuning.trailFrames, 0.03),
        parameters: GLOW_PARAMETERS,
      }),
  );
}
