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
in float vSqrtWeight;
in float vSoftRadiusPixels;

out vec4 fragColor;

void main(void) {
  geometry.uv = unitPosition;

  float distPixels = length(unitPosition) * outerRadiusPixels;
  float core = smoothstep(1.4, 0.3, distPixels);
  // Gaussian halo: a soft, wide shoulder instead of a spiky falloff, with a
  // per-point amplitude low enough that white needs hundreds of stacked
  // points — that slow additive build-up is what reads as glow. Its sigma
  // follows the soft-capped radius so heavy stacks stay distinguishable.
  float sigma = vSoftRadiusPixels * 0.35;
  // Aggregation collapsed stacked points into one draw; sqrt(weight) raises
  // the halo AMPLITUDE rather than the summed profile, so heavy stacks keep a
  // gaussian gradient instead of clipping into a flat disc. The exponential
  // shoulder (film-exposure response) approaches 1 without ever clipping, so
  // intensity keeps discriminating stack sizes. Weight 1 is near-identical.
  float gain = 1.0 - exp(-vSqrtWeight * 0.035);
  float halo = gain * exp(-distPixels * distPixels / (2.0 * sigma * sigma));
  // The core reads pure white; the halo carries the fill color's tint.
  vec3 color = mix(vFillColor.rgb, vec3(1.0), core);
  fragColor = vec4(color, vFillColor.a * min(core + halo, 1.0));

  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

export default class GlowLayer<DataT> extends ScatterplotLayer<DataT> {
  static layerName = 'GlowLayer';

  getShaders() {
    return {
      ...super.getShaders(),
      fs,
      // The radius attribute carries sqrt(weight); hand it to the fragment
      // stage, along with a soft-capped radius: instead of the hard clamp at
      // radiusMaxPixels, tanh approaches it asymptotically so ever-heavier
      // stacks keep growing (less and less) instead of all looking alike.
      inject: {
        'vs:#decl': 'out float vSqrtWeight;\nout float vSoftRadiusPixels;',
        'vs:#main-end': `\
vSqrtWeight = instanceRadius;
float rawRadiusPixels = project_size_to_pixel(scatterplot.radiusScale * instanceRadius, scatterplot.radiusUnits);
vSoftRadiusPixels = max(
  scatterplot.radiusMaxPixels * tanh(rawRadiusPixels / scatterplot.radiusMaxPixels),
  scatterplot.radiusMinPixels
);`,
      },
    };
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

/**
 * The visual knobs of the glow trail. Radii are ground distances in meters so
 * the on-screen density — and therefore the additive glow intensity — stays
 * invariant across zoom levels.
 */
export interface GlowTuning {
  /** Master per-point transparency, 0-255: density does the brightening. */
  pointAlpha: number;
  /** Halo tint; the shader keeps the point core pure white. */
  haloTint: [number, number, number];
  /** Radius of the freshest frame's points, in meters (per unit of weight). */
  flashRadius: number;
  /** Ghost radii taper linearly from this down to ghostMinRadius, in meters. */
  ghostMaxRadius: number;
  ghostMinRadius: number;
  /** Floor in pixels so isolated points survive deep zoom-outs. Applies to
   *  the freshest frame; ghosts get it scaled down with their age taper. */
  minRadiusPx: number;
  /** Asymptote of the rendered radius, in pixels: the halo tends toward it
   *  (tanh) as stacks grow, without ever flattening against a hard clamp. */
  maxRadiusPx: number;
  /** How many past frames stay visible as fading ghosts. */
  trailFrames: number;
}

// Defaults calibrated on the glow-lab bench (apps/website /lab/glow); the
// ghost radii keep the 2/3 and 1/15 taper ratios of the flash radius.
export const DEFAULT_GLOW_TUNING: GlowTuning = {
  pointAlpha: 115,
  haloTint: [190, 222, 255],
  flashRadius: 80_000,
  ghostMaxRadius: 53_000,
  ghostMinRadius: 5_000,
  minRadiusPx: 12,
  maxRadiusPx: 80,
  trailFrames: 12,
};

function radiusForAge(age: number, tuning: GlowTuning): number {
  if (age === 0) return tuning.flashRadius;
  const taper = (age - 1) / Math.max(tuning.trailFrames - 2, 1);
  return tuning.ghostMaxRadius - (tuning.ghostMaxRadius - tuning.ghostMinRadius) * taper;
}

// Ghosts fade geometrically with age. Applied in the fill color, not the
// layer opacity — deck gamma-corrects opacity (^1/2.2), which would keep the
// oldest ghost at ~32% instead of ~9%.
const GHOST_FADE = 0.8;

function alphaForFrame(age: number, tuning: GlowTuning): number {
  return Math.round(tuning.pointAlpha * GHOST_FADE ** age);
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
        getFillColor: [...tuning.haloTint, alphaForFrame(age, tuning)],
        // Fill-rate is the frame budget: cost grows with the quad area (r²),
        // so ghost frames shrink with age — the glow cools as it fades. The
        // pixel floor tapers along, or it would resurrect every ghost.
        radiusScale: radiusForAge(age, tuning),
        radiusMinPixels: (tuning.minRadiusPx * radiusForAge(age, tuning)) / tuning.flashRadius,
        radiusMaxPixels: tuning.maxRadiusPx,
        radiusUnits: 'meters',
        stroked: false,
        parameters: GLOW_PARAMETERS,
      }),
  );
}
