import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { BloomEffect, VignetteEffect, BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { getWorld } from '../../game';

// Post-processing (HIGH quality only). Loaded lazily, so LOW quality never downloads postprocessing.
// Effects are created once and animated through their uniforms. Changing props on the
// <Bloom>/<Vignette> wrappers would recreate the effect and recompile the EffectPass shader.
const BLOOM_INTENSITY = { normal: 1.5, boost: 2.6 };
const VIGNETTE_DARKNESS = { normal: 1.1, boost: 1.45 };
const POST_FX_LERP_SPEED = 8;

export default function PostEffects() {
  const [bloom] = useState(
    () =>
      new BloomEffect({
        blendFunction: BlendFunction.ADD,
        intensity: BLOOM_INTENSITY.normal,
        luminanceThreshold: 0.12,
        luminanceSmoothing: 0.8,
        mipmapBlur: true,
      })
  );
  const [vignette] = useState(
    () => new VignetteEffect({ offset: 0.25, darkness: VIGNETTE_DARKNESS.normal })
  );

  useEffect(() => {
    return () => {
      bloom.dispose();
      vignette.dispose();
    };
  }, [bloom, vignette]);

  const bloomRef = useRef<BloomEffect>(null);
  const vignetteRef = useRef<VignetteEffect>(null);

  useFrame((_state, delta) => {
    if (!bloomRef.current || !vignetteRef.current) return;
    const boostActive = (getWorld()?.timers.boostRemaining ?? 0) > 0;
    const t = Math.min(1, delta * POST_FX_LERP_SPEED);
    const targetIntensity = boostActive ? BLOOM_INTENSITY.boost : BLOOM_INTENSITY.normal;
    const targetDarkness = boostActive ? VIGNETTE_DARKNESS.boost : VIGNETTE_DARKNESS.normal;
    bloomRef.current.intensity = THREE.MathUtils.lerp(bloomRef.current.intensity, targetIntensity, t);
    vignetteRef.current.darkness = THREE.MathUtils.lerp(vignetteRef.current.darkness, targetDarkness, t);
  });

  // 8x MSAA (the EffectComposer default) on half-float targets is costly; 4x keeps wireframes clean.
  return (
    <EffectComposer multisampling={4}>
      <primitive ref={bloomRef} object={bloom} />
      <primitive ref={vignetteRef} object={vignette} />
    </EffectComposer>
  );
}
