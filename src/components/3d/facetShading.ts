/**
 * GLSL for the emissive stage of a flat-shaded material: shades each facet from a fixed view-space key light,
 * so faceted shapes read the same under any scene lighting. minBrightness is the darkest facet relative to the
 * brightest; lower means a sharper cut.
 */
export function facetShadingGlsl(minBrightness: number): string {
  return `
  float facetLight = max(dot(normal, normalize(vec3(0.5, 0.7, 0.5))), 0.0);
  totalEmissiveRadiance *= ${minBrightness.toFixed(2)} + ${(1 - minBrightness).toFixed(2)} * facetLight * facetLight;`;
}
