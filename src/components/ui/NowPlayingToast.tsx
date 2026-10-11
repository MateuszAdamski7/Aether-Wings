import { useState, useEffect, useRef } from 'react';
import { musicPlayer, type SongTrack } from '../../utils/musicPlayer';
import { SkipForward } from 'lucide-react';

export default function NowPlayingToast() {
  const [song, setSong] = useState<SongTrack | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = musicPlayer.subscribe((newSong) => {
      setSong(newSong);
      setVisible(true);

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Hide after exactly 5 seconds
      hideTimeoutRef.current = window.setTimeout(() => {
        setVisible(false);
      }, 5000);
    });

    return () => {
      unsubscribe();
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (visible) {
      hideTimeoutRef.current = window.setTimeout(() => {
        setVisible(false);
      }, 3000);
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    musicPlayer.playNext();
  };

  if (!song) return null;

  return (
    <div
      className="now-playing-toast"
      data-visible={visible}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        // Position and slide-in transform live in index.css (they differ on narrow screens)
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 10000,
        transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity, transform',
        maxWidth: '340px',
        width: 'calc(100vw - 48px)'
      }}
    >
      <div className="flex items-center justify-end gap-2">
        {/* Track metadata, right-aligned towards the corner */}
        <div className="flex flex-col items-end min-w-0 text-right">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-end gap-[2px] h-2.5" aria-hidden="true">
              <span className="w-[2px] h-full bg-[#00f3ff] animate-pulse [animation-duration:0.6s]" />
              <span className="w-[2px] h-[65%] bg-[#ff007f] animate-pulse [animation-duration:0.4s]" />
              <span className="w-[2px] h-[85%] bg-[#ffe600] animate-pulse [animation-duration:0.8s]" />
            </div>
            <span className="holo-label holo-glow-cyan text-[#00f3ff]">Now playing</span>
          </div>

          <div title={song.title} className="max-w-full truncate text-[15px] font-bold leading-tight text-white holo-shadow">
            {song.title}
          </div>
          <div className="max-w-full truncate text-[13px] font-semibold leading-tight text-[#00f3ff] holo-shadow">
            {song.artist}
          </div>
          <div className="holo-label holo-shadow text-[8px] tracking-[0.24em] text-white/50 mt-1.5">
            {song.source} · <span className="text-[#ffe600]">{song.license}</span>
          </div>
        </div>

        <button onClick={handleSkip} title="Next track" aria-label="Next track" className="holo-icon-btn">
          <SkipForward size={18} />
        </button>
      </div>
    </div>
  );
}
