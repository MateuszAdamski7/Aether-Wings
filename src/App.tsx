import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import GameCanvas from './components/3d/GameCanvas';
import MainMenu from './components/ui/MainMenu';
import GameHUD from './components/ui/GameHUD';
import GameOver from './components/ui/GameOver';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { audioManager } from './utils/audio';

function App() {
  const gameState = useGameStore((state) => state.gameState);
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);

  // 1. Global Keyboard Steering Controller & Boost Activation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Capture key events for steering left/right
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveRight(); // Move visual Left
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveLeft();  // Move visual Right
      } else if (e.key === ' ' || e.code === 'Space') {
        // Prevent default spacebar scrolling
        e.preventDefault();
        useGameStore.getState().activateBoost();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [moveLeft, moveRight]);

  // 2. Audio Cleanup on App Dismount
  useEffect(() => {
    return () => {
      audioManager.stopMusic();
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* 3D Scene Viewport */}
      <ErrorBoundary>
        <GameCanvas />
      </ErrorBoundary>

      {/* Cyberpunk Scanlines CRT overlay */}
      <div className="scanlines" />

      {/* Conditional HUD / Menu Overlays */}
      {gameState === 'START' && <MainMenu />}
      
      {gameState === 'PLAYING' && <GameHUD />}
      
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
