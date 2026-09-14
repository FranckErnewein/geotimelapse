import { ScatterplotLayer } from 'deck.gl';

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
