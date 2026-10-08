import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function configureAutoReset(renderer: THREE.WebGLRenderer, enabled: boolean) {
  renderer.info.autoReset = enabled;
}

export default function PerfTelemetry() {
  const { gl } = useThree();

  const domRef = useRef<HTMLDivElement | null>(null);
  const fpsValRef = useRef<HTMLSpanElement | null>(null);
  const msValRef = useRef<HTMLSpanElement | null>(null);
  const drawsValRef = useRef<HTMLSpanElement | null>(null);
  const trisValRef = useRef<HTMLSpanElement | null>(null);
  const geomsValRef = useRef<HTMLSpanElement | null>(null);
  const texValRef = useRef<HTMLSpanElement | null>(null);
  const memValRef = useRef<HTMLSpanElement | null>(null);

  const lastUpdateRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    // 1. Create Synthwave Performance Telemetry Bar DOM container
    const container = document.createElement('div');
    container.className = 'perf-telemetry-panel';
    container.style.cssText = `
      position: fixed;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10002;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(8, 8, 22, 0.92);
      border: 1px solid rgba(0, 243, 255, 0.4);
      border-radius: 10px;
      padding: 6px 14px;
      box-shadow: 0 0 20px rgba(0, 243, 255, 0.25), inset 0 0 8px rgba(0, 243, 255, 0.1);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      user-select: none;
      pointer-events: auto;
      font-family: var(--font-display, 'Orbitron', monospace);
    `;

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:4px;padding-right:6px;border-right:1px solid rgba(255,255,255,0.1);">
        <span style="font-size:8px;color:#94a3b8;font-weight:700;letter-spacing:1px;">FPS</span>
        <span id="perf-fps" style="font-size:12px;color:#00f3ff;font-weight:900;text-shadow:0 0 6px rgba(0,243,255,0.6);min-width:24px;text-align:right;">--</span>
      </div>

      <div style="display:flex;align-items:center;gap:4px;padding-right:6px;border-right:1px solid rgba(255,255,255,0.1);">
        <span style="font-size:8px;color:#94a3b8;font-weight:700;letter-spacing:1px;">CPU</span>
        <span id="perf-ms" style="font-size:11px;color:#39ff14;font-weight:800;min-width:38px;text-align:right;">--ms</span>
      </div>

      <div style="display:flex;align-items:center;gap:4px;padding-right:6px;border-right:1px solid rgba(255,255,255,0.1);">
        <span style="font-size:8px;color:#94a3b8;font-weight:700;letter-spacing:1px;">DRAWS</span>
        <span id="perf-draws" style="font-size:11px;color:#ffe600;font-weight:800;text-shadow:0 0 5px rgba(255,230,0,0.5);min-width:22px;text-align:right;">--</span>
      </div>

      <div style="display:flex;align-items:center;gap:4px;padding-right:6px;border-right:1px solid rgba(255,255,255,0.1);">
        <span style="font-size:8px;color:#94a3b8;font-weight:700;letter-spacing:1px;">TRIS</span>
        <span id="perf-tris" style="font-size:11px;color:#ffaa00;font-weight:800;text-shadow:0 0 5px rgba(255,170,0,0.5);min-width:34px;text-align:right;">--</span>
      </div>

      <div style="display:flex;align-items:center;gap:4px;padding-right:6px;border-right:1px solid rgba(255,255,255,0.1);">
        <span style="font-size:8px;color:#94a3b8;font-weight:700;letter-spacing:1px;">GEOMS</span>
        <span id="perf-geoms" style="font-size:11px;color:#ff007f;font-weight:800;text-shadow:0 0 5px rgba(255,0,127,0.5);min-width:20px;text-align:right;">--</span>
      </div>

      <div style="display:flex;align-items:center;gap:4px;padding-right:6px;border-right:1px solid rgba(255,255,255,0.1);">
        <span style="font-size:8px;color:#94a3b8;font-weight:700;letter-spacing:1px;">TEX</span>
        <span id="perf-tex" style="font-size:11px;color:#d946ef;font-weight:800;text-shadow:0 0 5px rgba(217,70,239,0.5);min-width:18px;text-align:right;">--</span>
      </div>

      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:8px;color:#94a3b8;font-weight:700;letter-spacing:1px;">MEM</span>
        <span id="perf-mem" style="font-size:11px;color:#00f3ff;font-weight:800;min-width:30px;text-align:right;">--</span>
      </div>
    `;

    document.body.appendChild(container);
    domRef.current = container;

    // Grab inner value elements
    fpsValRef.current = container.querySelector('#perf-fps');
    msValRef.current = container.querySelector('#perf-ms');
    drawsValRef.current = container.querySelector('#perf-draws');
    trisValRef.current = container.querySelector('#perf-tris');
    geomsValRef.current = container.querySelector('#perf-geoms');
    texValRef.current = container.querySelector('#perf-tex');
    memValRef.current = container.querySelector('#perf-mem');

    configureAutoReset(gl, false);

    return () => {
      configureAutoReset(gl, true);
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [gl]);

  useFrame((_, delta) => {
    frameCountRef.current++;
    const now = performance.now();

    // Update telemetry numbers every 120ms
    if (now - lastUpdateRef.current >= 120) {
      const elapsed = (now - lastTimeRef.current) / 1000;
      const currentFps = Math.round(frameCountRef.current / (elapsed || 0.016));
      const frameMs = (delta * 1000).toFixed(1);

      const frames = Math.max(1, frameCountRef.current);
      const callsPerFrame = Math.round(gl.info.render.calls / frames);
      const trianglesPerFrame = Math.round(gl.info.render.triangles / frames);

      frameCountRef.current = 0;
      lastTimeRef.current = now;
      lastUpdateRef.current = now;

      // Extract real-time WebGL render & memory statistics accumulated across passes
      const geoms = gl.info.memory.geometries;
      const textures = gl.info.memory.textures;
      gl.info.reset();

      const trisFormatted =
        trianglesPerFrame >= 1000 ? `${(trianglesPerFrame / 1000).toFixed(1)}k` : `${trianglesPerFrame}`;

      if (fpsValRef.current) {
        fpsValRef.current.innerText = `${currentFps}`;
        fpsValRef.current.style.color = currentFps >= 55 ? '#00f3ff' : currentFps >= 35 ? '#ffe600' : '#ff0055';
      }
      if (msValRef.current) {
        msValRef.current.innerText = `${frameMs}ms`;
      }
      if (drawsValRef.current) {
        drawsValRef.current.innerText = `${callsPerFrame}`;
      }
      if (trisValRef.current) {
        trisValRef.current.innerText = trisFormatted;
      }
      if (geomsValRef.current) {
        geomsValRef.current.innerText = `${geoms}`;
      }
      if (texValRef.current) {
        texValRef.current.innerText = `${textures}`;
      }
      if (memValRef.current) {
        const perfMemory = 'memory' in performance
          ? (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory
          : undefined;
        if (perfMemory && perfMemory.usedJSHeapSize) {
          const memMB = Math.round(perfMemory.usedJSHeapSize / 1048576);
          memValRef.current.innerText = `${memMB}MB`;
        } else {
          // Fallback if browser security denies heap access: show WebGL shader programs count
          const programs = gl.info.programs?.length ?? 0;
          memValRef.current.innerText = `${programs} prg`;
        }
      }
    }
  });

  return null;
}
