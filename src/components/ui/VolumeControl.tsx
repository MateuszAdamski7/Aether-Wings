import type { CSSProperties } from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

const VOLUME_STEP = 0.05;

/** Mute button that slides out a volume slider to its left on hover or focus */
export default function VolumeControl() {
  const isMuted = useGameStore((state) => state.isMuted);
  const volume = useGameStore((state) => state.volume);
  const toggleMute = useGameStore((state) => state.toggleMute);
  const setVolume = useGameStore((state) => state.setVolume);

  const level = isMuted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;

  return (
    <div className="volume-control">
      <div className="volume-slider">
        <input
          type="range"
          min={0}
          max={1}
          step={VOLUME_STEP}
          value={level}
          onChange={(e) => setVolume(Number(e.target.value))}
          // Hand the keyboard back to the game once a mouse drag ends, otherwise A/D and the arrows keep moving
          // the slider instead of the ship
          onPointerUp={(e) => {
            if (e.pointerType === 'mouse') e.currentTarget.blur();
          }}
          className="holo-range"
          style={{ '--fill': `${level * 100}%` } as CSSProperties}
          aria-label="Volume"
          aria-valuetext={`${Math.round(level * 100)}%`}
        />
      </div>
      <button
        onClick={toggleMute}
        className="holo-icon-btn"
        title={isMuted ? 'Unmute' : 'Mute'}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <Icon size={20} />
      </button>
    </div>
  );
}
