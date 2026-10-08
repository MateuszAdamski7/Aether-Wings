import { useEffect, useRef, type RefObject } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getWorld, type World } from '../../game';
import { Volume2, VolumeX, ShieldAlert, Shield, Award, Activity, Zap, Pause } from 'lucide-react';

const HUD_UPDATE_INTERVAL_MS = 33; // ~30 fps is plenty for text readouts
const SPEEDOMETER_MAX_SPEED = 100;
const SPEED_TO_KMH = 8;

// Bars are filled with transform (compositor-only) instead of width, which would force a layout ~30x per second.
function barFill(fraction: number): string {
  return `scaleX(${Math.max(0, Math.min(1, fraction))})`;
}

// Continuous readouts derived from the live World (null outside a run)
const readouts = {
  score: (w: World | null) => (w?.score ?? 0).toLocaleString(),
  distance: (w: World | null) => `${Math.floor(w?.distance ?? 0)}m`,
  speed: (w: World | null) => `${Math.floor((w?.player.speed ?? 0) * SPEED_TO_KMH)}`,
  speedFill: (w: World | null) => barFill((w?.player.speed ?? 0) / SPEEDOMETER_MAX_SPEED),
  boostTime: (w: World | null) => `${Math.max(0, w?.timers.boostRemaining ?? 0).toFixed(1)}s remaining`,
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
  const speedRef = useRef<HTMLSpanElement>(null);
  const speedBarRef = useRef<HTMLDivElement>(null);

  const boostBarRef = useRef<HTMLDivElement>(null);
  const boostTimeRef = useRef<HTMLSpanElement>(null);
  const magnetBarRef = useRef<HTMLDivElement>(null);
  const magnetTimeRef = useRef<HTMLSpanElement>(null);
  const shieldRegenBarRef = useRef<HTMLDivElement>(null);
  const shieldRegenTimeRef = useRef<HTMLSpanElement>(null);

  // Read discrete state hooks (only re-render on actual state change events)
  const crystalCount = useGameStore((state) => state.crystalCount);
  const isMuted = useGameStore((state) => state.isMuted);
  const toggleMute = useGameStore((state) => state.toggleMute);
  const showPerfStats = useGameStore((state) => state.showPerfStats);
  const togglePerfStats = useGameStore((state) => state.togglePerfStats);
  const collisionTriggered = useGameStore((state) => state.collisionTriggered);
  
  // Boost state subscriptions (discrete flags)
  const boostCharge = useGameStore((state) => state.boostCharge);
  const boostActive = useGameStore((state) => state.boostActive);
  const activateBoost = useGameStore((state) => state.activateBoost);
  const pauseGame = useGameStore((state) => state.pauseGame);

  // Upgrades & Power-Up discrete active flags (prevents 60-120fps re-renders during active timers)
  const shieldActive = useGameStore((state) => state.shieldActive);
  const shieldStrength = useGameStore((state) => state.shieldStrength);
  const isMagnetActive = useGameStore((state) => state.magnetActive);
  const isShieldRecharging = useGameStore((state) => state.shieldRecharging);
  const currentSector = useGameStore((state) => state.currentSector);
  
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
      setText(speedRef, readouts.speed(world));
      setTransform(speedBarRef, readouts.speedFill(world));
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

  return (
    <div className="game-hud absolute inset-0 z-10 pointer-events-none select-none hud-container flex flex-col justify-between">
      {/* 1. TOP HEADER BAR */}
      <div className="flex justify-between items-start w-full">
        {/* Top-Left: Score, Distance & Sector */}
        <div className="glass-panel p-3 sm:p-4 flex flex-col gap-1 border-glow-purple pointer-events-auto sm:min-w-[160px]">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#00f3ff] font-bold display-font">Score</div>
              <div ref={scoreRef} className="display-font text-xl sm:text-2xl font-black text-white text-glow-cyan leading-tight">
                {readouts.score(world)}
              </div>
            </div>
            {/* Sector indicator badge */}
            <div className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold display-font border ${
              currentSector === 1 
                ? 'bg-purple-950/20 text-[#9d00ff] border-[#9d00ff]/30 shadow-[0_0_4px_#9d00ff]' 
                : currentSector === 2 
                  ? 'bg-amber-950/20 text-[#ffaa00] border-[#ffaa00]/30 shadow-[0_0_4px_#ffaa00]'
                  : 'bg-red-950/20 text-[#ff003c] border-[#ff003c]/30 shadow-[0_0_4px_#ff003c]'
            }`}>
              Sec {currentSector}
            </div>
          </div>
          <div className="border-t border-white/10 pt-1 mt-1">
            <div className="text-[9px] uppercase tracking-widest text-gray-400 font-medium display-font">Distance</div>
            <div ref={distanceRef} className="display-font text-sm font-bold text-gray-200">
              {readouts.distance(world)}
            </div>
          </div>
        </div>

        {/* Top-Right: Crystals, Boost & Volume */}
        <div className="flex gap-2 sm:gap-4 items-start sm:items-center">
          {/* Crystals Counter & Boost Charge */}
          <div className="glass-panel px-3 sm:px-4 py-3 flex flex-col gap-2 border-glow-magenta pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[#ff007f] rotate-45 animate-pulse shadow-[0_0_8px_#ff007f]" style={{ borderRadius: '2px' }} />
              <div>
                <div className="text-[9px] uppercase tracking-widest text-gray-400 display-font">Crystals</div>
                <div className="display-font text-lg font-bold text-[#ff007f] text-glow-magenta leading-none mt-0.5">
                  {crystalCount}
                </div>
              </div>
            </div>
            
            {/* Boost segments */}
            <div className="border-t border-white/10 pt-1.5 w-full min-w-[100px] sm:min-w-[130px]">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[8px] uppercase tracking-widest text-gray-400 display-font">Boost Energy</span>
                <span className="display-font text-[9px] font-bold text-[#ffe600] text-glow-yellow">{boostCharge}/10</span>
              </div>
              <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5 flex gap-[1px]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-full flex-1 transition-all duration-300 ${
                      i < boostCharge 
                        ? boostCharge === 10 
                          ? 'bg-[#ffe600] shadow-[0_0_4px_#ffe600] animate-pulse' 
                          : 'bg-[#ff007f]' 
                        : 'bg-white/10'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Icon buttons stack vertically on narrow screens to leave room for the stat panels */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* Performance Telemetry Toggle (F3) */}
            <button
              onClick={togglePerfStats}
              className={`p-2.5 sm:p-3 glass-panel text-white hover:text-cyan-400 transition-colors pointer-events-auto ${
                showPerfStats ? 'border-glow-cyan text-glow-cyan' : 'border-white/10 opacity-60'
              }`}
              style={{ borderRadius: '10px' }}
              title={showPerfStats ? 'Hide Performance Telemetry (F3)' : 'Show Performance Telemetry (F3)'}
            >
              <Activity size={18} className={showPerfStats ? 'text-[#00f3ff]' : 'text-gray-400'} />
            </button>

            {/* Mute button */}
            <button
              onClick={toggleMute}
              className="p-2.5 sm:p-3 glass-panel border-glow-purple text-white hover:text-cyan-400 transition-colors pointer-events-auto"
              style={{ borderRadius: '10px' }}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Pause button (Esc / P) */}
            {!collisionTriggered && (
              <button
                onClick={pauseGame}
                className="p-2.5 sm:p-3 glass-panel border-glow-cyan text-white hover:text-cyan-400 transition-colors pointer-events-auto"
                style={{ borderRadius: '10px' }}
                title="Pause (Esc / P)"
                aria-label="Pause"
              >
                <Pause size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Boost Ready Alert Banner */}
      {boostCharge === 10 && !boostActive && !collisionTriggered && (
        <div className="absolute inset-x-0 top-1/4 flex justify-center items-center pointer-events-none">
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
              activateBoost();
            }}
            className="glass-panel border-glow-yellow px-8 py-4 bg-yellow-950/40 text-[#ffe600] flex flex-col items-center gap-1 animate-pulse min-w-[260px] pointer-events-auto cursor-pointer"
          >
            <span className="display-font font-black text-xl tracking-widest text-glow-yellow">HYPERBOOST READY</span>
            <span className="display-font text-[10px] font-bold uppercase tracking-wider text-white mt-1">TAP HERE OR PRESS SPACEBAR</span>
          </button>
        </div>
      )}

      {/* Active Boost Timer Overlay */}
      {boostActive && !collisionTriggered && (
        <div className="absolute inset-x-0 top-1/4 flex justify-center items-center pointer-events-none">
          <div className="glass-panel border-glow-orange px-8 py-4 bg-orange-950/50 text-[#ffaa00] flex flex-col items-center gap-2 min-w-[280px]">
            <span className="display-font font-black text-2xl tracking-widest text-glow-orange animate-pulse">HYPERBOOST ACTIVE</span>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-orange-500/20 mt-1">
              <div 
                ref={boostBarRef}
                className="h-full w-full origin-left bg-gradient-to-r from-orange-600 to-yellow-400 transition-transform duration-75"
                style={{ transform: readouts.boostFill(world) }}
              />
            </div>
            <span ref={boostTimeRef} className="display-font text-[10px] font-bold text-yellow-200 mt-0.5 uppercase tracking-widest">
              {readouts.boostTime(world)}
            </span>
          </div>
        </div>
      )}

      {/* Warning Flash during collision */}
      {collisionTriggered && (
        <div className="absolute inset-x-0 top-1/3 flex justify-center items-center pointer-events-none">
          <div className="glass-panel border-glow-magenta px-8 py-4 bg-red-950/70 text-[#ff0055] flex items-center gap-3 animate-bounce">
            <ShieldAlert size={28} className="animate-pulse" />
            <span className="display-font font-black text-xl tracking-widest text-glow-magenta">COLLISION DETECTED</span>
          </div>
        </div>
      )}

      {/* Mission Accomplished Banner Alert */}
      {recentCompletedMission && (
        <div className="absolute inset-x-0 top-1/4 flex justify-center items-center pointer-events-none z-20">
          <div className="glass-panel border-glow-yellow px-8 py-3 bg-yellow-950/60 text-[#ffe600] flex flex-col items-center gap-1 animate-bounce min-w-[280px] pointer-events-auto">
            <span className="display-font font-black text-sm tracking-widest text-glow-yellow flex items-center gap-1.5">
              <Award size={16} /> CHALLENGE COMPLETED
            </span>
            <span className="display-font text-[10px] font-bold text-white text-center uppercase tracking-wider mt-0.5">
              {recentCompletedMission.description}
            </span>
            <span className="display-font text-xs font-black text-[#ffe600] mt-0.5">
              + {recentCompletedMission.reward} Crystals 💎
            </span>
          </div>
        </div>
      )}

      {/* 2. BOTTOM STATS BAR */}
      <div className="flex justify-between items-end w-full">
        {/* Bottom-Left: Speedometer & Active Power-up timer bars */}
        <div className="flex flex-col gap-2.5 w-full max-w-[220px] pointer-events-auto">
          {/* Active Power-Ups overlay */}
          {(isMagnetActive || isShieldRecharging) && (
            <div className="flex flex-col gap-1.5 w-full">
              {isMagnetActive && (
                <div className="glass-panel px-3 py-1.5 border-glow-magenta bg-pink-950/20 text-xs flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[8px] uppercase font-bold text-[#ff007f] display-font">
                    <span>Magnet Sweep</span>
                    <span ref={magnetTimeRef}>{readouts.magnetTime(world)}</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div 
                      ref={magnetBarRef}
                      className="h-full w-full origin-left bg-[#ff007f] shadow-[0_0_4px_#ff007f]"
                      style={{ transform: readouts.magnetFill(world) }}
                    />
                  </div>
                </div>
              )}
              {isShieldRecharging && (
                <div className="glass-panel px-3 py-1.5 border-glow-cyan bg-cyan-950/20 text-xs flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[8px] uppercase font-bold text-[#00f3ff] display-font">
                    <span>Shield Recharging</span>
                    <span ref={shieldRegenTimeRef}>{readouts.shieldRegenTime(world)}</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div 
                      ref={shieldRegenBarRef}
                      className="h-full w-full origin-left bg-[#00f3ff] shadow-[0_0_4px_#00f3ff] animate-pulse"
                      style={{ transform: readouts.shieldRegenFill(world) }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Speedometer panel */}
          <div className="glass-panel p-4 border-glow-cyan">
            <div className="flex justify-between items-baseline mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 display-font">Velocity</span>
                {shieldActive && (
                  <span className="px-1.5 py-0.5 rounded bg-[#00f3ff]/10 border border-[#00f3ff]/30 flex items-center gap-1 animate-pulse" title={`Deflector Shield Active: ${shieldStrength} charge(s)`}>
                    <Shield size={9} className="text-[#00f3ff]" />
                    {shieldStrength > 1 && (
                      <span className="text-[8px] font-black text-[#00f3ff] display-font leading-none">x{shieldStrength}</span>
                    )}
                  </span>
                )}
              </div>
              <span className="display-font text-lg font-bold text-white text-glow-cyan">
                <span ref={speedRef}>{readouts.speed(world)}</span> <span className="text-[10px] text-cyan-400">km/h</span>
              </span>
            </div>
            {/* Progress bar container */}
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div
                ref={speedBarRef}
                className="h-full w-full origin-left bg-gradient-to-r from-purple-600 via-cyan-400 to-cyan-300 transition-transform duration-100 ease-out"
                style={{ transform: readouts.speedFill(world) }}
              />
            </div>
          </div>
        </div>

        {/* Bottom-Right: Touch Boost Button & Active Controls Mode indicator */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {/* Mobile Touch Hyperboost Trigger Button (visible on touch screens / pointer: coarse) */}
          <button
            id="mobile-boost-btn"
            type="button"
            disabled={boostCharge < 10 || boostActive}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (boostCharge === 10 && !boostActive) {
                if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
                activateBoost();
              }
            }}
            onTouchStart={(e) => {
              if (boostCharge === 10 && !boostActive) {
                e.preventDefault();
                e.stopPropagation();
                if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
                activateBoost();
              }
            }}
            className={`touch-boost-btn flex flex-col items-center justify-center transition-all ${
              boostActive
                ? 'boost-active'
                : boostCharge === 10
                  ? 'boost-ready animate-pulse'
                  : 'boost-charging opacity-40'
            }`}
            title={boostCharge === 10 ? 'Launch Hyperboost!' : `Boost charging (${boostCharge}/10)`}
          >
            <Zap 
              size={22} 
              className={boostActive ? 'text-[#ffaa00]' : boostCharge === 10 ? 'text-[#ffe600] fill-[#ffe600]' : 'text-gray-400'} 
            />
            <span className="display-font text-[9px] font-black tracking-wider leading-none mt-1">
              {boostActive ? 'ACTIVE' : boostCharge === 10 ? 'BOOST' : `${boostCharge}/10`}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}
