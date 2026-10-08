import { useEffect, lazy, Suspense } from 'react';
import { useGameStore } from './store/useGameStore';
import MainMenu from './components/ui/MainMenu';
import GameHUD from './components/ui/GameHUD';
import GameOver from './components/ui/GameOver';
import ErrorBoundary from './components/ui/ErrorBoundary';
import NowPlayingToast from './components/ui/NowPlayingToast';
import PauseMenu from './components/ui/PauseMenu';
import { attachGameInput } from './input/gameInput';

// The 3D scene (three.js, react-three-fiber) is the bulk of the bundle; loading it lazily lets the
// DOM menu appear while the engine is still downloading
const GameCanvas = lazy(() => import('./components/3d/GameCanvas'));
import { musicPlayer } from './utils/musicPlayer';

function App() {
  const gameState = useGameStore((state) => state.gameState);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);

  // Sync data-quality attribute with html root for CSS selectors
  useEffect(() => {
    document.documentElement.setAttribute('data-quality', graphicsQuality.toLowerCase());
  }, [graphicsQuality]);

  // 1. Player input (keyboard, touch swipes) mapped onto game actions
  useEffect(() => {
    const game = useGameStore.getState;
    return attachGameInput({
      shiftLane: (screenDirection) => game().shiftLane(screenDirection),
      boost: () => game().activateBoost(),
      pause: () => game().pauseGame(),
      togglePerfStats: () => game().togglePerfStats(),
    });
  }, []);

  // 1c. Auto-pause when the player leaves (app switch, notification shade, other window)
  useEffect(() => {
    const pause = () => useGameStore.getState().pauseGame();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') pause();
    };

    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 2. Continuous Background Music Controller
  useEffect(() => {
    const handleFirstInteraction = () => {
      musicPlayer.start();
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      musicPlayer.stop();
    };
  }, []);

  // 3. Auto-save progress on tab visibility change or page hide
  useEffect(() => {
    const handleSave = () => {
      useGameStore.getState().saveProgress();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleSave);
    window.addEventListener('beforeunload', handleSave);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleSave);
      window.removeEventListener('beforeunload', handleSave);
    };
  }, []);

  return (
    <div 
      data-quality={graphicsQuality.toLowerCase()}
      data-game-state={gameState.toLowerCase()}
      style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden', touchAction: 'none' }}
    >
      
      {/* 3D Scene Viewport */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <GameCanvas />
        </Suspense>
      </ErrorBoundary>

      {/* Cyberpunk Scanlines CRT overlay - disabled in LOW quality to eliminate composite layers */}
      {graphicsQuality === 'HIGH' && <div className="scanlines" />}

      {/* Now Playing Music Toast Banner (shown for 5 seconds on track change) */}
      <NowPlayingToast />

      {/* Conditional HUD / Menu Overlays */}
      {gameState === 'START' && <MainMenu />}
      
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && <GameHUD />}

      {gameState === 'PAUSED' && <PauseMenu />}
      
      {gameState === 'GAME_OVER' && (
        <>
          <GameHUD />
          <GameOver />
        </>
      )}

    </div>
  );
}

export default App;
