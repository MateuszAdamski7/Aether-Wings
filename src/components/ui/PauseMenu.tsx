import { useCallback, useEffect, useState } from 'react';
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
          className="display-font text-8xl sm:text-[160px] font-black text-[#00f3ff] holo-glow-cyan animate-pulse"
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
      <div className="holo-scrim-dense" />

      <div
        className="relative flex flex-col items-center text-center"
        role="dialog"
        aria-labelledby="pause-title"
      >
        <h1 id="pause-title" className="display-font text-5xl sm:text-[64px] font-black m-0 text-[#00f3ff] holo-glow-cyan tracking-[0.3em] pl-[0.3em]">
          PAUSED
        </h1>
        <p className="holo-label holo-shadow text-white/55 mt-2.5 mb-0">
          Systems on standby
        </p>

        <button onClick={startResume} className="holo-cta holo-glow-magenta text-[#ff4da6] hover:text-white mt-12 sm:mt-14">
          ›› RESUME ‹‹
        </button>
        <button onClick={handleQuit} className="holo-text-btn holo-shadow text-white/60 mt-3">
          QUIT TO MENU
        </button>

        <div className="holo-label holo-shadow text-white/40 mt-10">
          Esc / P to resume
        </div>
      </div>
    </div>
  );
}
