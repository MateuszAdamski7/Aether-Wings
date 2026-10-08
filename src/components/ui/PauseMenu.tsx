import { useCallback, useEffect, useState } from 'react';
import { Play, LogOut } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { audioManager } from '../../utils/audio';

const COUNTDOWN_FROM = 3;
const COUNTDOWN_STEP_MS = 700;
const RESUME_KEYS = new Set(['Escape', 'p', 'P', 'Enter', ' ']);

export default function PauseMenu() {
  const resumeGame = useGameStore((state) => state.resumeGame);
  const quitToMenu = useGameStore((state) => state.quitToMenu);
  // null = waiting on the pause card, number = resume countdown in progress
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      resumeGame();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), COUNTDOWN_STEP_MS);
    return () => clearTimeout(timer);
  }, [countdown, resumeGame]);

  // Losing focus mid-countdown cancels it, so the run never resumes while the player is away
  useEffect(() => {
    const cancelCountdown = () => setCountdown(null);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') cancelCountdown();
    };
    window.addEventListener('blur', cancelCountdown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('blur', cancelCountdown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const startResume = useCallback(() => {
    audioManager.playStartFx();
    setCountdown((current) => current ?? COUNTDOWN_FROM);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!RESUME_KEYS.has(e.key)) return;
      e.preventDefault();
      startResume();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startResume]);

  const handleQuit = () => {
    audioManager.playStartFx();
    quitToMenu();
  };

  if (countdown !== null) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none select-none">
        <span
          key={countdown}
          className="display-font text-8xl font-black text-[#00f3ff] text-glow-cyan animate-pulse"
          role="status"
          aria-live="assertive"
        >
          {countdown}
        </span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center hud-container select-none">
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <div
        className="glass-panel relative w-full max-w-xs p-8 flex flex-col items-center text-center border-glow-cyan"
        role="dialog"
        aria-labelledby="pause-title"
      >
        <h1 id="pause-title" className="display-font text-4xl font-black mb-1 text-[#00f3ff] text-glow-cyan tracking-widest">
          PAUSED
        </h1>
        <p className="display-font text-[10px] uppercase tracking-widest text-gray-400 mb-6">
          Systems on standby
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button onClick={startResume} className="btn-cyber btn-cyber-magenta px-8 py-3 w-full justify-center">
            <Play size={16} className="mr-2" />
            RESUME
          </button>
          <button onClick={handleQuit} className="btn-cyber px-8 py-2.5 w-full justify-center" style={{ fontSize: '11px' }}>
            <LogOut size={14} className="mr-1.5" />
            QUIT TO MENU
          </button>
        </div>

        <div className="text-[9px] uppercase tracking-widest text-gray-500 mt-4 display-font">
          Esc / P to resume
        </div>
      </div>
    </div>
  );
}
