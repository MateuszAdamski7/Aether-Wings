import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { audioManager } from '../../utils/audio';
import { RefreshCw, Trophy, Zap, Compass, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GameOver() {
  const score = useGameStore((state) => state.score);
  const highScore = useGameStore((state) => state.highScore);
  const crystalCount = useGameStore((state) => state.crystalCount);
  const distance = useGameStore((state) => state.distance);
  const startGame = useGameStore((state) => state.startGame);
  const resetGame = useGameStore((state) => state.resetGame);
  const setMenuTab = useGameStore((state) => state.setMenuTab);
  
  // Upgrades & Mission states
  const lifetimeCrystals = useGameStore((state) => state.lifetimeCrystals);
  const activeMissions = useGameStore((state) => state.activeMissions);

  // Check if they set a new high score
  const isNewHighScore = score >= highScore && score > 0;
  const confettiTriggered = useRef(false);

  useEffect(() => {
    if (isNewHighScore && !confettiTriggered.current) {
      confettiTriggered.current = true;
      // Trigger a beautiful double confetti burst!
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isNewHighScore]);

  const handleRestart = () => {
    audioManager.startMusic();
    audioManager.playStartFx();
    startGame();
  };

  const handleBackToMenu = (tab: 'PLAY' | 'GARAGE' | 'MISSIONS') => {
    audioManager.playStartFx();
    setMenuTab(tab);
    resetGame();
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 select-none crt-flicker">
      {/* Background Dim overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

      {/* Main Card */}
      <div className="glass-panel w-full max-w-md p-8 flex flex-col items-center text-center border-glow-magenta relative z-20">
        
        {/* Flashing Danger Header */}
        <h1 
          className="display-font text-4xl md:text-5xl font-black mb-6 text-glow-magenta glitch text-red-500"
          data-text="SYSTEM CRASH"
          style={{ letterSpacing: '2px' }}
        >
          SYSTEM CRASH
        </h1>

        {/* High Score Celebration Banner */}
        {isNewHighScore && (
          <div className="w-full py-2 px-4 mb-6 rounded-md bg-[#ffe600]/10 border border-[#ffe600]/30 animate-pulse flex items-center justify-center gap-2 text-[#ffe600]">
            <Trophy size={16} className="text-glow-yellow" />
            <span className="display-font text-xs font-bold uppercase tracking-widest text-glow-yellow">
              NEW RECORD ESTABLISHED!
            </span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full flex flex-col gap-3 mb-6 bg-black/30 p-4 rounded-xl border border-white/5 text-gray-300">
          
          {/* Final Score */}
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <div className="flex items-center gap-2 text-gray-400">
              <Trophy size={16} />
              <span className="text-xs uppercase tracking-wider">Final Score</span>
            </div>
            <span className="display-font font-bold text-glow-yellow text-[#ffe600] text-lg">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Distance */}
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <div className="flex items-center gap-2 text-gray-400">
              <Compass size={16} />
              <span className="text-xs uppercase tracking-wider">Distance Covered</span>
            </div>
            <span className="display-font font-bold text-white text-md">
              {Math.floor(distance)}m
            </span>
          </div>

          {/* Crystals collected this run */}
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <div className="flex items-center gap-2 text-gray-400">
              <Zap size={16} />
              <span className="text-xs uppercase tracking-wider">Crystals Salvaged</span>
            </div>
            <span className="display-font font-bold text-[#ff007f] text-glow-magenta text-md">
              {crystalCount}
            </span>
          </div>

          {/* Lifetime Crystals wallet */}
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Shield size={16} />
              <span className="text-xs uppercase tracking-wider">Wallet Balance</span>
            </div>
            <span className="display-font font-bold text-[#ffe600] text-glow-yellow text-md">
              {lifetimeCrystals} 💎
            </span>
          </div>

        </div>

        {/* Mission Progress Panel */}
        <div className="w-full flex flex-col gap-2.5 mb-6 text-left border-t border-white/10 pt-4">
          <span className="display-font text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Active Challenges Progress</span>
          <div className="flex flex-col gap-2 w-full">
            {activeMissions.map((m) => (
              <div key={m.id} className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px] font-semibold text-gray-200">
                  <span className="truncate max-w-[220px]">{m.description}</span>
                  <span className={m.completed ? 'text-[#39ff14]' : 'text-gray-400'}>
                    {m.completed ? 'COMPLETED' : `${m.current}/${m.target}`}
                  </span>
                </div>
                <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full ${m.completed ? 'bg-[#39ff14] shadow-[0_0_2px_#39ff14]' : 'bg-cyan-500'}`}
                    style={{ width: `${(m.current / m.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Group */}
        <div className="flex flex-col gap-3 w-full">
          {/* Restart Button */}
          <button 
            onClick={handleRestart}
            className="btn-cyber btn-cyber-magenta px-8 py-3 w-full justify-center"
          >
            <RefreshCw size={16} className="mr-2 animate-spin" style={{ animationDuration: '4s' }} />
            REBOOT SYSTEM
          </button>

          <div className="flex gap-3 w-full">
            {/* Garage Button */}
            <button 
              onClick={() => handleBackToMenu('GARAGE')}
              className="btn-cyber px-4 py-2.5 justify-center"
              style={{ flex: 1, borderColor: 'var(--neon-cyan)', boxShadow: '0 0 8px rgba(0, 243, 255, 0.15)', fontSize: '11px', letterSpacing: '1px' }}
            >
              <Shield size={14} className="mr-1.5" />
              GARAGE
            </button>

            {/* Missions Button */}
            <button 
              onClick={() => handleBackToMenu('MISSIONS')}
              className="btn-cyber px-4 py-2.5 justify-center"
              style={{ flex: 1, borderColor: 'var(--neon-yellow)', boxShadow: '0 0 8px rgba(255, 230, 0, 0.15)', fontSize: '11px', letterSpacing: '1px' }}
            >
              <Trophy size={14} className="mr-1.5" />
              MISSIONS
            </button>
          </div>
        </div>

        <div className="text-[9px] uppercase tracking-widest text-gray-500 mt-4 display-font">
          Select action to proceed
        </div>
      </div>
    </div>
  );
}
