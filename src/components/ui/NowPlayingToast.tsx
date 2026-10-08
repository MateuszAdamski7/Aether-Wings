import { useState, useEffect, useRef } from 'react';
import { musicPlayer, type SongTrack } from '../../utils/musicPlayer';
import { Music, Disc3, SkipForward } from 'lucide-react';

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
      <div
        className="toast-glass"
        style={{
          border: '1px solid rgba(0, 243, 255, 0.4)',
          borderRadius: '12px',
          boxShadow: '0 0 25px rgba(0, 243, 255, 0.22), inset 0 0 12px rgba(0, 243, 255, 0.08)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Neon Accent Glow strip on the left edge */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            background: 'linear-gradient(180deg, #00f3ff, #ff007f)',
            boxShadow: '0 0 10px #00f3ff'
          }}
        />

        {/* Animated Synthwave Vinyl / Equalizer Icon */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 243, 255, 0.08)',
            border: '1px solid rgba(0, 243, 255, 0.3)',
            flexShrink: 0
          }}
        >
          <Disc3
            size={22}
            className="animate-spin"
            style={{
              color: '#00f3ff',
              animationDuration: '4s',
              filter: 'drop-shadow(0 0 6px rgba(0, 243, 255, 0.6))'
            }}
          />
          <Music
            size={10}
            style={{
              position: 'absolute',
              color: '#ffffff'
            }}
          />
        </div>

        {/* Track Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          {/* Header row: NOW PLAYING label + Equalizer bars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '9px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#00f3ff',
                textShadow: '0 0 6px rgba(0, 243, 255, 0.7)'
              }}
            >
              NOW PLAYING
            </span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '10px', marginLeft: '4px' }}>
              <span
                className="animate-pulse"
                style={{ width: '2px', height: '100%', backgroundColor: '#00f3ff', borderRadius: '999px', animationDuration: '0.6s' }}
              />
              <span
                className="animate-pulse"
                style={{ width: '2px', height: '65%', backgroundColor: '#ff007f', borderRadius: '999px', animationDuration: '0.4s' }}
              />
              <span
                className="animate-pulse"
                style={{ width: '2px', height: '85%', backgroundColor: '#ffe600', borderRadius: '999px', animationDuration: '0.8s' }}
              />
            </div>
          </div>

          {/* Title */}
          <div
            title={song.title}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {song.title}
          </div>

          {/* Artist */}
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 600,
              color: '#00f3ff',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: '1px'
            }}
          >
            {song.artist}
          </div>

          {/* Badges: Source & License */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span
              style={{
                fontSize: '8px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
                color: '#94a3b8',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {song.source}
            </span>
            <span
              style={{
                fontSize: '8px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 700,
                color: '#ffe600',
                backgroundColor: 'rgba(255, 230, 0, 0.1)',
                border: '1px solid rgba(255, 230, 0, 0.3)',
                padding: '2px 6px',
                borderRadius: '4px',
                textShadow: '0 0 5px rgba(255, 230, 0, 0.5)'
              }}
            >
              {song.license}
            </span>
          </div>
        </div>

        {/* Quick Skip button */}
        <button
          onClick={handleSkip}
          title="Next track"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 243, 255, 0.25)',
            borderRadius: '8px',
            color: '#00f3ff',
            cursor: 'pointer',
            padding: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 243, 255, 0.15)';
            e.currentTarget.style.borderColor = '#00f3ff';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(0, 243, 255, 0.25)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <SkipForward size={14} />
        </button>
      </div>
    </div>
  );
}
