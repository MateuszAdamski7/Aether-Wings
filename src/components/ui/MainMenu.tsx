import { useGameStore } from '../../store/useGameStore';
import { audioManager } from '../../utils/audio';
import { 
  Volume2, 
  VolumeX, 
  Keyboard, 
  MousePointerClick, 
  Cpu
} from 'lucide-react';
import GarageTab from './MainMenu/GarageTab';
import MissionsTab from './MainMenu/MissionsTab';

export default function MainMenu() {
  const activeTab = useGameStore((state) => state.menuTab);
  const setActiveTab = useGameStore((state) => state.setMenuTab);
  const startGame = useGameStore((state) => state.startGame);
  const highScore = useGameStore((state) => state.highScore);
  const isMuted = useGameStore((state) => state.isMuted);
  const toggleMute = useGameStore((state) => state.toggleMute);
  const volume = useGameStore((state) => state.volume);
  const setVolume = useGameStore((state) => state.setVolume);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const setGraphicsQuality = useGameStore((state) => state.setGraphicsQuality);

  const toggleGraphics = () => {
    const nextQuality = graphicsQuality === 'HIGH' ? 'LOW' : 'HIGH';
    setGraphicsQuality(nextQuality);
    audioManager.playStartFx();
  };

  const handleStart = () => {
    audioManager.startMusic();
    audioManager.playStartFx();
    startGame();
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 select-none crt-flicker">
      {/* Top bar controls */}
      <div className="absolute top-6 right-6 flex items-center gap-4">
        {/* Graphics Quality Toggle */}
        <button
          onClick={toggleGraphics}
          className={`p-2.5 glass-panel text-white hover:text-white transition-all pointer-events-auto flex items-center justify-center ${
            graphicsQuality === 'HIGH' ? 'border-glow-magenta text-glow-magenta' : 'border-glow-cyan text-glow-cyan'
          }`}
          style={{ 
            borderRadius: '50%', 
            border: graphicsQuality === 'HIGH' ? '1px solid rgba(255, 0, 127, 0.4)' : '1px solid rgba(0, 243, 255, 0.4)',
            boxShadow: graphicsQuality === 'HIGH' ? '0 0 8px rgba(255, 0, 127, 0.25)' : '0 0 8px rgba(0, 243, 255, 0.25)'
          }}
          title={graphicsQuality === 'HIGH' ? 'Switch to Performance Mode (Runs cooler)' : 'Switch to High Quality Graphics'}
        >
          <Cpu size={16} className={graphicsQuality === 'HIGH' ? 'animate-pulse' : ''} />
        </button>

        {/* Audio Mute & Volume Slider */}
        <div 
          className="flex items-center gap-2 glass-panel border-glow-purple p-1 pointer-events-auto"
          style={{ 
            borderRadius: '24px', 
            border: '1px solid rgba(157, 0, 255, 0.4)',
            paddingLeft: '10px',
            paddingRight: '12px',
            height: '42px',
            boxShadow: '0 0 8px rgba(157, 0, 255, 0.25)'
          }}
        >
          <button
            onClick={toggleMute}
            className="text-white hover:text-cyan-400 transition-colors flex items-center justify-center"
            title={isMuted ? 'Unmute' : 'Mute'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
            }}
            className="cyber-slider"
            style={{ width: '85px' }}
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>
      </div>

      {/* Main Panel */}
      <div 
        className="glass-panel p-8 flex flex-col items-center border-glow-purple pointer-events-auto"
        style={{
          width: '760px',
          height: '640px',
          transform: 'scale(min(1, calc((100vw - 48px) / 760), calc((100vh - 48px) / 640)))',
          transformOrigin: 'center',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        {/* Title */}
        <h1 
          className="display-font text-4xl md:text-5xl font-black mb-6 text-glow-magenta glitch text-center"
          data-text="AETHER WINGS"
          style={{ letterSpacing: '4px', color: '#ff007f' }}
        >
          AETHER WINGS
        </h1>

        {/* Tab Selection */}
        <div className="flex gap-4 mb-6 border-b border-white/10 pb-2 w-full justify-center">
          <button 
            onClick={() => setActiveTab('PLAY')}
            className={`px-4 py-1 display-font text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'PLAY' ? 'text-[#00f3ff] border-b-2 border-[#00f3ff] text-glow-cyan' : 'text-gray-400 hover:text-white'
            }`}
          >
            Launch
          </button>
          <button 
            onClick={() => setActiveTab('GARAGE')}
            className={`px-4 py-1 display-font text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'GARAGE' ? 'text-[#ff007f] border-b-2 border-[#ff007f] text-glow-magenta' : 'text-gray-400 hover:text-white'
            }`}
          >
            Garage
          </button>
          <button 
            onClick={() => setActiveTab('MISSIONS')}
            className={`px-4 py-1 display-font text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'MISSIONS' ? 'text-[#ffe600] border-b-2 border-[#ffe600] text-glow-yellow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Missions
          </button>
        </div>

        {/* 1. PLAY TAB */}
        {activeTab === 'PLAY' && (
          <div className="flex flex-col items-center w-full text-center">
            {/* High Score Panel */}
            <div className="flex flex-col items-center mb-6 px-6 py-2.5 border-l-2 border-r-2 border-[#9d00ff] bg-black/30 w-full max-w-xs">
              <span className="text-[10px] uppercase tracking-widest text-gray-400">Personal Best</span>
              <span className="display-font text-xl font-bold text-glow-yellow text-[#ffe600]">
                {highScore.toLocaleString()} PTS
              </span>
            </div>

            {/* Instructions */}
            <div className="grid grid-cols-2 gap-4 w-full text-left mb-8 text-gray-300">
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-1.5 text-[#00f3ff]">
                  <Keyboard size={14} />
                  <h3 className="display-font text-xs font-bold uppercase tracking-wider">Keyboard</h3>
                </div>
                <p className="text-[10px] leading-normal text-gray-400">
                  Steer with <b className="text-white">A / D</b> or <b className="text-white">← / →</b>. Press <b className="text-white">SPACE</b> for Hyperboost when fully charged.
                </p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-1.5 text-[#ff007f]">
                  <MousePointerClick size={14} />
                  <h3 className="display-font text-xs font-bold uppercase tracking-wider">Mouse</h3>
                </div>
                <p className="text-[10px] leading-normal text-gray-400">
                  Move cursor left/right. The ship follows fluidly. Spacebar triggers hyperboost.
                </p>
              </div>
            </div>

            {/* Start Button */}
            <button 
              onClick={handleStart}
              className="btn-cyber btn-cyber-magenta px-10 py-3.5 text-md w-full max-w-xs justify-center"
            >
              PLAY
            </button>

            <div className="text-[9px] uppercase tracking-widest text-gray-500 mt-6 display-font">
              System Status: Ready to Launch
            </div>
          </div>
        )}

        {/* 2. GARAGE TAB */}
        {activeTab === 'GARAGE' && <GarageTab />}

        {/* 3. MISSIONS TAB */}
        {activeTab === 'MISSIONS' && <MissionsTab />}
      </div>
    </div>
  );
}
