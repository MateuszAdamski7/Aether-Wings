import { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ShieldAlert, Award } from 'lucide-react';

export default function GameHUD() {
  // Read state hooks
  const score = useGameStore((state) => state.score);
  const distance = useGameStore((state) => state.distance);
  const speed = useGameStore((state) => state.speed);
  const maxSpeed = useGameStore((state) => state.maxSpeed);
  const crystalCount = useGameStore((state) => state.crystalCount);
  const controlMode = useGameStore((state) => state.controlMode);
  const collisionTriggered = useGameStore((state) => state.collisionTriggered);
  
  // Boost state subscriptions
  const boostCharge = useGameStore((state) => state.boostCharge);
  const boostActive = useGameStore((state) => state.boostActive);
  const boostTimeRemaining = useGameStore((state) => state.boostTimeRemaining);

  // Upgrades & Power-Up subscriptions
  const shieldActive = useGameStore((state) => state.shieldActive);
  const shieldRegenTimer = useGameStore((state) => state.shieldRegenTimer);
  const magnetActiveTime = useGameStore((state) => state.magnetActiveTime);
  const slowMoActiveTime = useGameStore((state) => state.slowMoActiveTime);
  const upgrades = useGameStore((state) => state.upgrades);
  
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

  // Speedometer calculation
  const speedPercentage = (speed / maxSpeed) * 100;
  const speedKmh = Math.floor(speed * 8); // Scaled multiplier for arcade KMH look

  return (
    <div className="absolute inset-0 z-10 pointer-events-none select-none p-6 flex flex-col justify-between">
      {/* 1. TOP HEADER BAR */}
      <div className="flex justify-between items-start w-full">
        {/* Top-Left: Score & Distance */}
        <div className="glass-panel p-4 flex flex-col gap-1 border-glow-purple pointer-events-auto min-w-[160px]">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#00f3ff] font-bold display-font">Score</div>
            <div className="display-font text-2xl font-black text-white text-glow-cyan leading-tight">
              {score.toLocaleString()}
            </div>
          </div>
          <div className="border-t border-white/10 pt-1 mt-1">
            <div className="text-[9px] uppercase tracking-widest text-gray-400 font-medium display-font">Distance</div>
            <div className="display-font text-sm font-bold text-gray-200">
              {Math.floor(distance)}m
            </div>
          </div>
        </div>

        {/* Top-Right: Crystals & Boost */}
        <div className="flex gap-4 items-center">
          {/* Crystals Counter & Boost Charge */}
          <div className="glass-panel px-4 py-3 flex flex-col gap-2 border-glow-magenta pointer-events-auto">
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
            <div className="border-t border-white/10 pt-1.5 w-full min-w-[130px]">
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
        </div>
      </div>

      {/* Boost Ready Alert Banner */}
      {boostCharge === 10 && !boostActive && !collisionTriggered && (
        <div className="absolute inset-x-0 top-1/4 flex justify-center items-center pointer-events-none">
          <div className="glass-panel border-glow-yellow px-8 py-4 bg-yellow-950/40 text-[#ffe600] flex flex-col items-center gap-1 animate-pulse min-w-[260px] pointer-events-auto">
            <span className="display-font font-black text-xl tracking-widest text-glow-yellow">HYPERBOOST READY</span>
            <span className="display-font text-[10px] font-bold uppercase tracking-wider text-white mt-1">PRESS SPACEBAR TO LAUNCH</span>
          </div>
        </div>
      )}

      {/* Active Boost Timer Overlay */}
      {boostActive && !collisionTriggered && (
        <div className="absolute inset-x-0 top-1/4 flex justify-center items-center pointer-events-none">
          <div className="glass-panel border-glow-orange px-8 py-4 bg-orange-950/50 text-[#ffaa00] flex flex-col items-center gap-2 min-w-[280px]">
            <span className="display-font font-black text-2xl tracking-widest text-glow-orange animate-pulse">HYPERBOOST ACTIVE</span>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-orange-500/20 mt-1">
              <div 
                className="h-full bg-gradient-to-r from-orange-600 to-yellow-400 transition-all duration-75"
                style={{ width: `${(boostTimeRemaining / 5.0) * 100}%` }}
              />
            </div>
            <span className="display-font text-[10px] font-bold text-yellow-200 mt-0.5 uppercase tracking-widest">{boostTimeRemaining.toFixed(1)}s remaining</span>
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
          {(magnetActiveTime > 0 || slowMoActiveTime > 0 || (upgrades.defense_shield_3 && !shieldActive && shieldRegenTimer > 0)) && (
            <div className="flex flex-col gap-1.5 w-full">
              {magnetActiveTime > 0 && (
                <div className="glass-panel px-3 py-1.5 border-glow-magenta bg-pink-950/20 text-xs flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[8px] uppercase font-bold text-[#ff007f] display-font">
                    <span>Magnet Sweep</span>
                    <span>{magnetActiveTime.toFixed(1)}s</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-[#ff007f] shadow-[0_0_4px_#ff007f]" 
                      style={{ width: `${(magnetActiveTime / 8.0) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {slowMoActiveTime > 0 && (
                <div className="glass-panel px-3 py-1.5 border-glow-yellow bg-yellow-950/20 text-xs flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[8px] uppercase font-bold text-[#ffe600] display-font">
                    <span>Slow-Mo Warp</span>
                    <span>{slowMoActiveTime.toFixed(1)}s</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-[#ffe600] shadow-[0_0_4px_#ffe600]" 
                      style={{ width: `${(slowMoActiveTime / 5.0) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {upgrades.defense_shield_3 && !shieldActive && shieldRegenTimer > 0 && (
                <div className="glass-panel px-3 py-1.5 border-glow-cyan bg-cyan-950/20 text-xs flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[8px] uppercase font-bold text-[#00f3ff] display-font">
                    <span>Shield Recharging</span>
                    <span>{shieldRegenTimer.toFixed(1)}s</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-[#00f3ff] shadow-[0_0_4px_#00f3ff] animate-pulse" 
                      style={{ width: `${((40.0 - shieldRegenTimer) / 40.0) * 100}%` }}
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
              </div>
              <span className="display-font text-lg font-bold text-white text-glow-cyan">{speedKmh} <span className="text-[10px] text-cyan-400">km/h</span></span>
            </div>
            {/* Progress bar container */}
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-cyan-400 to-cyan-300 transition-all duration-100 ease-out"
                style={{ width: `${speedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom-Right: Active Controls */}
        <div className="glass-panel px-3 py-2 border border-white/10 flex items-center gap-2 pointer-events-auto">
          <div className={`w-2 h-2 rounded-full ${controlMode === 'MOUSE' ? 'bg-[#ff007f] shadow-[0_0_8px_#ff007f]' : 'bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]'}`} />
          <span className="display-font text-[9px] font-bold uppercase tracking-wider text-gray-300">
            {controlMode} MODE ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}
