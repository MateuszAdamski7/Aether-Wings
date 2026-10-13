import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { audioManager } from '../../utils/audio';
import { musicPlayer } from '../../utils/musicPlayer';
import CrystalIcon from './CrystalIcon';

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

      // canvas-confetti is only needed on a new record, so it is loaded on demand
      let interval: ReturnType<typeof setInterval> | undefined;
      let cancelled = false;
      import('canvas-confetti')
        .then(({ default: confetti }) => {
          if (cancelled) return;
          interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 40 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
          }, 250);
        })
        .catch((err) => console.warn('[GameOver] Could not load confetti effect:', err));

      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }
  }, [isNewHighScore]);

  const handleRestart = () => {
    musicPlayer.start();
    audioManager.playStartFx();
    startGame();
  };

  const handleBackToMenu = (tab: 'PLAY' | 'GARAGE' | 'MISSIONS') => {
    audioManager.playStartFx();
    setMenuTab(tab);
    resetGame();
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center hud-container z-10 select-none">
      <div className="holo-scrim-dense" />

      {/* On short screens the results scroll while the actions stay pinned at the bottom */}
      <div className="relative w-full max-w-[600px] max-h-full flex flex-col items-center text-center">
        <div className="w-full min-h-0 overflow-y-auto flex flex-col items-center">
          <h1 className="display-font text-3xl sm:text-5xl font-black m-0 text-[#ff2d6a] holo-glow-red tracking-[0.2em] sm:tracking-[0.26em] pl-[0.26em]">
            SYSTEM CRASH
          </h1>
          <p className="holo-label holo-glow-magenta text-[#ff4da6] mt-2.5 mb-0">
            Ship hull integrity failed
          </p>

          {isNewHighScore && (
            <span className="holo-label holo-glow-yellow text-xs text-[#ffe600] mt-6 animate-pulse">
              ◆ New record established ◆
            </span>
          )}

          <span className="holo-label holo-shadow text-white/60 mt-5">Final score</span>
          <span className="holo-num holo-glow-yellow text-5xl sm:text-[72px] text-[#ffe600] mt-2">
            {score.toLocaleString()}
          </span>

          <div className="flex gap-8 sm:gap-20 mt-7">
            <div className="flex flex-col items-center gap-2">
              <span className="holo-label holo-shadow text-white/55">Distance</span>
              <span className="holo-num holo-shadow text-lg sm:text-2xl">{Math.floor(distance).toLocaleString()}m</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="holo-label holo-shadow text-white/55">Salvaged</span>
              <span className="holo-num holo-glow-magenta text-lg sm:text-2xl text-[#ff4da6] flex items-center gap-1.5">{crystalCount} <CrystalIcon size={18} className="drop-shadow-[0_0_5px_#ff007f]" /></span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="holo-label holo-shadow text-white/55">Wallet</span>
              <span className="holo-num holo-shadow text-lg sm:text-2xl text-[#ffe9a8] flex items-center gap-1.5">{lifetimeCrystals.toLocaleString()} <CrystalIcon size={18} /></span>
            </div>
          </div>

          {/* Mission progress */}
          <div className="w-full flex flex-col gap-3 mt-8 text-left">
            <span className="holo-label holo-glow-cyan text-[#00f3ff]">Challenges</span>
            {activeMissions.map((m) => (
              <div key={m.id} className="grid grid-cols-[minmax(0,1fr)_72px_52px] sm:grid-cols-[minmax(0,1fr)_120px_90px] items-center gap-3 sm:gap-[18px]">
                <span className="truncate text-sm sm:text-base font-semibold holo-shadow">{m.description}</span>
                <div className="holo-track">
                  <div
                    className={`h-full ${m.completed ? 'bg-[#3dffa8] shadow-[0_0_6px_#3dffa8]' : 'bg-[#00f3ff] shadow-[0_0_6px_#00f3ff]'}`}
                    style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%` }}
                  />
                </div>
                <span className={`holo-label text-right ${m.completed ? 'text-[#3dffa8] holo-glow-green' : 'text-white/65 holo-shadow'}`}>
                  {m.completed ? 'Done' : `${m.current}/${m.target}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center w-full shrink-0 mt-6">
          <button onClick={handleRestart} className="holo-cta holo-glow-magenta text-[#ff4da6] hover:text-white">
            ›› REBOOT SYSTEM ‹‹
          </button>
          <div className="flex gap-7 mt-1">
            <button onClick={() => handleBackToMenu('GARAGE')} className="holo-text-btn holo-glow-cyan text-[#00f3ff]">
              GARAGE
            </button>
            <button onClick={() => handleBackToMenu('MISSIONS')} className="holo-text-btn holo-glow-yellow text-[#ffe600]">
              MISSIONS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
