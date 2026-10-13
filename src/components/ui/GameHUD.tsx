import { useEffect, useRef, type RefObject } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getWorld, type World } from '../../game';
import { TriangleAlert, Zap, Pause } from 'lucide-react';
import CrystalIcon from './CrystalIcon';
import VolumeControl from './VolumeControl';

const HUD_UPDATE_INTERVAL_MS = 33; // ~30 fps is plenty for text readouts
const BOOST_SEGMENTS = 10;
const BOOST_RING_RADIUS = 38;
const BOOST_RING_CIRCUMFERENCE = 2 * Math.PI * BOOST_RING_RADIUS;

// Bars are filled with transform (compositor-only) instead of width, which would force a layout ~30x per second.
function barFill(fraction: number): string {
  return `scaleX(${Math.max(0, Math.min(1, fraction))})`;
}

// Continuous readouts derived from the live World (null outside a run)
const readouts = {
  score: (w: World | null) => (w?.score ?? 0).toLocaleString(),
  distance: (w: World | null) => `${Math.floor(w?.distance ?? 0).toLocaleString()} m`,
  boostTime: (w: World | null) => `${Math.max(0, w?.timers.boostRemaining ?? 0).toFixed(1)}s`,
  boostFill: (w: World | null) => barFill(w ? w.timers.boostRemaining / w.modifiers.boostDuration : 0),
  magnetTime: (w: World | null) => `${Math.max(0, w?.timers.magnetActive ?? 0).toFixed(1)}s`,
  magnetFill: (w: World | null) => barFill(w ? w.timers.magnetActive / w.modifiers.magnetPowerupDuration : 0),
  shieldRegenTime: (w: World | null) => `${Math.max(0, w?.timers.shieldRegen ?? 0).toFixed(1)}s`,
  shieldRegenFill: (w: World | null) => {
    if (!w) return barFill(0);
    const cooldown = w.modifiers.shieldRegenCooldown;
    return barFill((cooldown - w.timers.shieldRegen) / cooldown);
  },
};

function setText(ref: RefObject<HTMLElement | null>, text: string): void {
  if (ref.current) ref.current.textContent = text;
}

function setTransform(ref: RefObject<HTMLElement | null>, transform: string): void {
  if (ref.current) ref.current.style.transform = transform;
}

export default function GameHUD() {
  const scoreRef = useRef<HTMLDivElement>(null);
  const distanceRef = useRef<HTMLDivElement>(null);

  const boostBarRef = useRef<HTMLDivElement>(null);
  const boostTimeRef = useRef<HTMLSpanElement>(null);
  const magnetBarRef = useRef<HTMLDivElement>(null);
  const magnetTimeRef = useRef<HTMLSpanElement>(null);
  const shieldRegenBarRef = useRef<HTMLDivElement>(null);
  const shieldRegenTimeRef = useRef<HTMLSpanElement>(null);

  // Read discrete state hooks (only re-render on actual state change events)
  const crystalCount = useGameStore((state) => state.crystalCount);
  const collisionTriggered = useGameStore((state) => state.collisionTriggered);

  // Boost state subscriptions (discrete flags)
  const boostCharge = useGameStore((state) => state.boostCharge);
  const boostActive = useGameStore((state) => state.boostActive);
  const activateBoost = useGameStore((state) => state.activateBoost);
  const pauseGame = useGameStore((state) => state.pauseGame);

  // Power-up discrete active flags (prevents 60-120fps re-renders during active timers)
  const isMagnetActive = useGameStore((state) => state.magnetActive);
  const isShieldRecharging = useGameStore((state) => state.shieldRecharging);

  // Mission notifications
  const recentCompletedMission = useGameStore((state) => state.recentCompletedMission);
  const clearNotification = useGameStore((state) => state.clearCompletedMissionNotification);

  // Clear completed mission notification banner after 3.5 seconds
  useEffect(() => {
    if (recentCompletedMission) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [recentCompletedMission, clearNotification]);

  // Continuous readouts are written straight to the DOM from the World at ~30 fps, bypassing React
  useEffect(() => {
    let frameId = 0;
    let lastUpdate = 0;
    const update = (now: number) => {
      frameId = requestAnimationFrame(update);
      if (now - lastUpdate < HUD_UPDATE_INTERVAL_MS) return;
      lastUpdate = now;

      const world = getWorld();
      setText(scoreRef, readouts.score(world));
      setText(distanceRef, readouts.distance(world));
      setText(boostTimeRef, readouts.boostTime(world));
      setTransform(boostBarRef, readouts.boostFill(world));
      setText(magnetTimeRef, readouts.magnetTime(world));
      setTransform(magnetBarRef, readouts.magnetFill(world));
      setText(shieldRegenTimeRef, readouts.shieldRegenTime(world));
      setTransform(shieldRegenBarRef, readouts.shieldRegenFill(world));
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Initial values for elements mounting mid-run; the loop above keeps them current
  const world = getWorld();

  const boostReady = boostCharge === BOOST_SEGMENTS;
  const boostRingColor = boostActive ? '#ffaa00' : boostReady ? '#ffe600' : '#ff007f';
  const boostRingFill = boostActive ? 1 : boostCharge / BOOST_SEGMENTS;

  return (
    <div className="game-hud absolute inset-0 z-10 pointer-events-none select-none hud-container flex flex-col justify-between">
      {/* 1. TOP ROW */}
      <div className="flex justify-between items-start w-full">
        {/* Top-Left: Score & Distance */}
        <div className="flex flex-col gap-1.5">
          <div className="holo-label holo-shadow text-[#00f3ff]">Score</div>
          <div ref={scoreRef} className="holo-num holo-glow-cyan text-3xl sm:text-[46px] text-white">
            {readouts.score(world)}
          </div>
          <div ref={distanceRef} className="display-font text-xs font-semibold uppercase tracking-[0.2em] text-white/80 holo-shadow">
            {readouts.distance(world)}
          </div>
        </div>

        {/* Top-Right: Crystals, Boost charge & controls */}
        <div className="flex gap-3 sm:gap-7 items-start">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2.5">
              <CrystalIcon size={20} className="text-[#ff3d9e] drop-shadow-[0_0_6px_#ff007f]" />
              <span className="holo-num holo-glow-magenta text-2xl sm:text-3xl text-[#ff4da6]">{crystalCount}</span>
            </div>
            <div className="flex gap-[3px]">
              {Array.from({ length: BOOST_SEGMENTS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-[3px] transition-colors duration-300 ${
                    i < boostCharge
                      ? boostReady
                        ? 'bg-[#ffe600] shadow-[0_0_6px_#ffe600] animate-pulse'
                        : 'bg-[#ff007f] shadow-[0_0_6px_#ff007f]'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            <div className="holo-label holo-shadow text-white/65">
              Boost <span className="text-[#ffe600]">{boostCharge}/{BOOST_SEGMENTS}</span>
            </div>
          </div>

          {/* Icon buttons stack vertically on narrow screens to leave room for the readouts */}
          <div className="flex flex-col sm:flex-row sm:-mt-1.5 pointer-events-auto">
            <VolumeControl />

            {/* Pause button (Esc / P) */}
            {!collisionTriggered && (
              <button
                onClick={pauseGame}
                className="holo-icon-btn"
                title="Pause (Esc / P)"
                aria-label="Pause"
              >
                <Pause size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Center alerts share one column, so simultaneous ones stack instead of overlapping */}
      <div className="absolute inset-x-4 top-1/4 flex flex-col items-center gap-8 text-center pointer-events-none z-20">
        {/* Warning during collision */}
        {collisionTriggered && (
          <div className="flex justify-center items-center gap-3.5 text-[#ff2d6a]">
            <TriangleAlert size={26} className="animate-pulse drop-shadow-[0_0_8px_#ff2d6a]" />
            <span className="display-font font-black text-xl sm:text-3xl tracking-[0.3em] holo-glow-magenta">COLLISION</span>
          </div>
        )}

        {/* Boost Ready Alert */}
        {boostReady && !boostActive && !collisionTriggered && (
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
              activateBoost();
            }}
            className="flex flex-col items-center gap-2.5 animate-pulse pointer-events-auto cursor-pointer bg-transparent border-0 p-3"
          >
            <span className="flex items-center gap-5">
              <span className="hidden sm:block w-[140px] h-px bg-gradient-to-r from-transparent to-[#ffe600]" />
              <span className="display-font font-black text-xl sm:text-3xl tracking-[0.15em] sm:tracking-[0.3em] text-[#ffe600] holo-glow-yellow">
                HYPERBOOST READY
              </span>
              <span className="hidden sm:block w-[140px] h-px bg-gradient-to-l from-transparent to-[#ffe600]" />
            </span>
            <span className="holo-label holo-shadow text-white">Tap or press Space</span>
          </button>
        )}

        {/* Active Boost Timer */}
        {boostActive && !collisionTriggered && (
          <div className="flex flex-col items-center gap-3">
            <span className="display-font font-black text-xl sm:text-3xl tracking-[0.15em] sm:tracking-[0.3em] text-[#ffaa00] holo-glow-orange">
              HYPERBOOST ACTIVE
            </span>
            <div className="holo-track w-[320px] max-w-[70vw]">
              <div
                ref={boostBarRef}
                className="h-full w-full origin-left bg-gradient-to-r from-[#ff6a00] to-[#ffe600] shadow-[0_0_10px_#ffaa00] transition-transform duration-75"
                style={{ transform: readouts.boostFill(world) }}
              />
            </div>
            <span ref={boostTimeRef} className="holo-num holo-shadow text-xs tracking-[0.2em] text-[#ffe9a8]">
              {readouts.boostTime(world)}
            </span>
          </div>
        )}

        {/* Mission Accomplished Alert */}
        {recentCompletedMission && (
          <div className="flex flex-col items-center gap-2">
            <span className="holo-label holo-glow-yellow text-[#ffe600] text-xs">Challenge complete</span>
            <span className="display-font font-extrabold text-base sm:text-[22px] uppercase tracking-[0.12em] holo-shadow">
              {recentCompletedMission.description}
            </span>
            <span className="holo-num holo-glow-magenta text-base text-[#ff4da6] flex items-center gap-1.5">
              +{recentCompletedMission.reward} <CrystalIcon size={16} className="drop-shadow-[0_0_5px_#ff007f]" />
            </span>
          </div>
        )}
      </div>

      {/* 2. BOTTOM ROW */}
      <div className="flex justify-between items-end w-full">
        {/* Bottom-Left: Active power-up timers */}
        <div className="flex flex-col gap-3.5 w-full max-w-[200px]">
          {isMagnetActive && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <span className="holo-label holo-glow-magenta text-[#ff4da6]">Magnet</span>
                <span ref={magnetTimeRef} className="holo-num holo-shadow text-[13px]">{readouts.magnetTime(world)}</span>
              </div>
              <div className="holo-track">
                <div
                  ref={magnetBarRef}
                  className="h-full w-full origin-left bg-[#ff007f] shadow-[0_0_8px_#ff007f]"
                  style={{ transform: readouts.magnetFill(world) }}
                />
              </div>
            </div>
          )}
          {isShieldRecharging && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <span className="holo-label holo-glow-cyan text-[#00f3ff]">Shield recharge</span>
                <span ref={shieldRegenTimeRef} className="holo-num holo-shadow text-[13px]">{readouts.shieldRegenTime(world)}</span>
              </div>
              <div className="holo-track">
                <div
                  ref={shieldRegenBarRef}
                  className="h-full w-full origin-left bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]"
                  style={{ transform: readouts.shieldRegenFill(world) }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom-Right: Touch Hyperboost trigger (visible on touch screens / pointer: coarse) */}
        <div className="flex flex-col items-end pointer-events-auto">
          <button
            id="mobile-boost-btn"
            type="button"
            disabled={!boostReady || boostActive}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (boostReady && !boostActive) {
                if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
                activateBoost();
              }
            }}
            onTouchStart={(e) => {
              if (boostReady && !boostActive) {
                e.preventDefault();
                e.stopPropagation();
                if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
                activateBoost();
              }
            }}
            className={`touch-boost-btn items-center justify-center transition-transform ${
              boostActive ? 'boost-active' : boostReady ? 'boost-ready animate-pulse' : 'boost-charging'
            }`}
            title={boostReady ? 'Launch Hyperboost!' : `Boost charging (${boostCharge}/${BOOST_SEGMENTS})`}
            aria-label={boostReady ? 'Launch Hyperboost' : `Hyperboost charging ${boostCharge} of ${BOOST_SEGMENTS}`}
          >
            <svg width="88" height="88" viewBox="0 0 88 88" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="44" cy="44" r={BOOST_RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="3" />
              <circle
                cx="44"
                cy="44"
                r={BOOST_RING_RADIUS}
                fill="none"
                stroke={boostRingColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${boostRingFill * BOOST_RING_CIRCUMFERENCE} ${BOOST_RING_CIRCUMFERENCE}`}
                style={{ filter: `drop-shadow(0 0 6px ${boostRingColor})`, transition: 'stroke-dasharray 0.3s ease' }}
              />
            </svg>
            <span className="relative flex flex-col items-center gap-0.5">
              <Zap
                size={22}
                color={boostActive ? '#ffaa00' : '#ffe600'}
                fill={boostActive ? '#ffaa00' : boostReady ? '#ffe600' : 'none'}
              />
              <span className="holo-num holo-shadow text-[10px] tracking-[0.1em]">
                {boostActive ? 'ACTIVE' : boostReady ? 'BOOST' : `${boostCharge}/${BOOST_SEGMENTS}`}
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
