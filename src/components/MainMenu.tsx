import { useGameStore } from '../store/useGameStore';
import { audioManager } from '../utils/audio';
import { Volume2, VolumeX, Keyboard, MousePointerClick, Zap, Award, Flame } from 'lucide-react';

const SKINS = [
  { id: 'pink', name: 'Laser Pink', color: '#ff0055', cost: 0, description: 'Standard engine flame trim' },
  { id: 'cyan', name: 'Cyan Flare', color: '#00f3ff', cost: 40, description: 'Neon cyan engine flame trim' },
  { id: 'yellow', name: 'Solar Yellow', color: '#ffe600', cost: 40, description: 'Solar yellow engine flame trim' },
  { id: 'green', name: 'Acid Green', color: '#39ff14', cost: 40, description: 'Acid green engine flame trim' },
  { id: 'purple', name: 'Nebula Violet', color: '#9d00ff', cost: 40, description: 'Nebula violet engine flame trim' },
  { id: 'vortex', name: 'Vortex Singularity', color: '#00f3ff', cost: 150, description: 'Passive: 2x Crystals value & 2x Hyperboost charge' },
  { id: 'quantum', name: 'Quantum Vanguard', color: '#00ffff', cost: 150, description: 'Passive: Free start shield & auto-regen at 1500m' },
  { id: 'temporal', name: 'Temporal Warp Wing', color: '#ffe600', cost: 150, description: 'Passive: 0.45x Slow-Mo speed & 8s powerup clock' }
];

const MAGNET_COSTS = [30, 50, 80];

export default function MainMenu() {
  const activeTab = useGameStore((state) => state.menuTab);
  const setActiveTab = useGameStore((state) => state.setMenuTab);

  const startGame = useGameStore((state) => state.startGame);
  const highScore = useGameStore((state) => state.highScore);
  const isMuted = useGameStore((state) => state.isMuted);
  const toggleMute = useGameStore((state) => state.toggleMute);

  // Shop states
  const lifetimeCrystals = useGameStore((state) => state.lifetimeCrystals);
  const upgrades = useGameStore((state) => state.upgrades);
  const buyUpgrade = useGameStore((state) => state.buyUpgrade);
  const buySkin = useGameStore((state) => state.buySkin);
  const equipSkin = useGameStore((state) => state.equipSkin);
  
  // Mission states
  const activeMissions = useGameStore((state) => state.activeMissions);

  const handleStart = () => {
    audioManager.startMusic();
    audioManager.playStartFx();
    startGame();
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 select-none crt-flicker">
      {/* Top bar controls */}
      <div className="absolute top-6 right-6 flex items-center gap-4">
        <button
          onClick={toggleMute}
          className="p-3 glass-panel border-glow-purple text-white hover:text-cyan-400 transition-colors pointer-events-auto"
          style={{ borderRadius: '50%', border: '1px solid rgba(157, 0, 255, 0.4)' }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Main Panel */}
      <div className="glass-panel w-full max-w-lg p-8 flex flex-col items-center border-glow-purple pointer-events-auto">
        {/* Title */}
        <h1 
          className="display-font text-4xl md:text-5xl font-black mb-1 text-glow-magenta glitch text-center"
          data-text="AETHER RIDER"
          style={{ letterSpacing: '4px', color: '#ff007f' }}
        >
          AETHER RIDER
        </h1>
        <p className="display-font text-xs uppercase tracking-widest text-cyan-400 mb-6 text-glow-cyan text-center">
          Retro 3D Infinite Runner
        </p>

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
                  <Keyboard size={16} />
                  <h3 className="display-font text-xs font-bold uppercase tracking-wider">Keyboard</h3>
                </div>
                <p className="text-[10px] leading-normal text-gray-400">
                  Steer with <b className="text-white">A / D</b> or <b className="text-white">← / →</b>. Press <b className="text-white">SPACE</b> for Hyperboost when fully charged.
                </p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-1.5 text-[#ff007f]">
                  <MousePointerClick size={16} />
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
              START ENGINES
            </button>

            <div className="text-[9px] uppercase tracking-widest text-gray-500 mt-6 display-font">
              System Status: Ready to Launch
            </div>
          </div>
        )}

        {/* 2. GARAGE TAB */}
        {activeTab === 'GARAGE' && (
          <div className="flex flex-col w-full text-left">
            {/* Crystal Wallet */}
            <div className="flex justify-between items-center bg-black/30 border border-white/10 rounded-lg px-4 py-2 mb-6">
              <span className="display-font text-xs font-medium text-gray-400 uppercase tracking-widest">Available Crystals</span>
              <span className="display-font text-lg font-bold text-[#ff007f] text-glow-magenta">{lifetimeCrystals} 💎</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
              {/* Left Side: Upgrades */}
              <div className="flex flex-col gap-4">
                <h3 className="display-font text-xs font-black uppercase text-cyan-400 tracking-wider mb-1 border-b border-cyan-500/20 pb-1 flex items-center gap-1.5">
                  <Zap size={14} /> Ship Upgrades
                </h3>
                
                {/* Magnet Upgrade */}
                <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-baseline">
                    <span className="display-font text-xs font-bold text-white uppercase">Crystal Magnet</span>
                    <span className="text-[10px] text-gray-400">Lvl {upgrades.magnetLevel}/3</span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-snug">
                    Pulls crystals dynamically from adjacent lanes (Radius: {upgrades.magnetLevel === 0 ? '0.8' : upgrades.magnetLevel === 1 ? '1.5' : upgrades.magnetLevel === 2 ? '2.5' : '4.0'}m).
                  </p>
                  {upgrades.magnetLevel < 3 ? (
                    <button 
                      onClick={() => buyUpgrade('MAGNET')}
                      disabled={lifetimeCrystals < MAGNET_COSTS[upgrades.magnetLevel]}
                      className={`text-[10px] font-bold py-1.5 rounded uppercase tracking-widest text-center transition-all ${
                        lifetimeCrystals >= MAGNET_COSTS[upgrades.magnetLevel]
                          ? 'bg-[#00f3ff]/20 hover:bg-[#00f3ff]/40 text-[#00f3ff] border border-[#00f3ff]/30'
                          : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                      }`}
                    >
                      Upgrade: {MAGNET_COSTS[upgrades.magnetLevel]} 💎
                    </button>
                  ) : (
                    <div className="text-[9px] font-bold py-1 bg-cyan-950/20 text-[#00f3ff] text-center border border-[#00f3ff]/20 rounded">
                      MAX LEVEL UNLOCKED
                    </div>
                  )}
                </div>

                {/* Shield Deflector */}
                <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-baseline">
                    <span className="display-font text-xs font-bold text-white uppercase">Deflector Shield</span>
                    <span className="text-[10px] text-gray-400">{upgrades.shieldBought ? '1 Ready' : 'Empty'}</span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-snug">
                    Absorbs a single normal obstacle collision. Consumed upon launch.
                  </p>
                  <button 
                    onClick={() => buyUpgrade('SHIELD')}
                    disabled={upgrades.shieldBought || lifetimeCrystals < 25}
                    className={`text-[10px] font-bold py-1.5 rounded uppercase tracking-widest text-center transition-all ${
                      upgrades.shieldBought
                        ? 'bg-green-950/20 text-[#39ff14] border border-[#39ff14]/30 cursor-default'
                        : lifetimeCrystals >= 25
                          ? 'bg-[#00f3ff]/20 hover:bg-[#00f3ff]/40 text-[#00f3ff] border border-[#00f3ff]/30'
                          : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                    }`}
                  >
                    {upgrades.shieldBought ? 'Shield Charged' : 'Purchase: 25 💎'}
                  </button>
                </div>
              </div>

              {/* Right Side: Skins */}
              <div className="flex flex-col gap-4">
                <h3 className="display-font text-xs font-black uppercase text-[#ff007f] tracking-wider mb-1 border-b border-[#ff007f]/20 pb-1 flex items-center gap-1.5">
                  <Flame size={14} /> Engine Exhaust Trim
                </h3>

                <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                  {SKINS.map((skin) => {
                    const isUnlocked = upgrades.unlockedSkins.includes(skin.id);
                    const isEquipped = upgrades.equippedSkin === skin.id;

                    return (
                      <div 
                        key={skin.id}
                        onClick={() => isUnlocked ? equipSkin(skin.id) : buySkin(skin.id, skin.cost)}
                        className={`p-2.5 rounded-lg border flex justify-between items-center cursor-pointer transition-all ${
                          isEquipped
                            ? 'bg-white/10 border-[#ff007f] shadow-[0_0_8px_rgba(255,0,127,0.2)]'
                            : isUnlocked
                              ? 'bg-black/20 border-white/10 hover:border-[#00f3ff]'
                              : 'bg-black/40 border-white/5 hover:border-[#ffe600]/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-3 h-3 rounded-full border border-white/20 mt-0.5" 
                            style={{ 
                              backgroundColor: skin.color, 
                              boxShadow: `0 0 6px ${skin.color}`,
                              flexShrink: 0
                            }} 
                          />
                          <div className="flex flex-col">
                            <span className="display-font text-xs font-semibold text-gray-200">{skin.name}</span>
                            {skin.description && (
                              <span className="text-[9px] text-gray-400 mt-0.5 leading-snug">{skin.description}</span>
                            )}
                          </div>
                        </div>
                        <div>
                          {isEquipped ? (
                            <span className="text-[9px] uppercase font-black text-[#ff007f] tracking-wider">EQUIPPED</span>
                          ) : isUnlocked ? (
                            <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider">USE SKIN</span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#ffe600]">{skin.cost} 💎</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. MISSIONS TAB */}
        {activeTab === 'MISSIONS' && (
          <div className="flex flex-col w-full text-left">
            <h3 className="display-font text-xs font-black uppercase text-[#ffe600] tracking-wider mb-4 border-b border-[#ffe600]/20 pb-1.5 flex items-center gap-1.5">
              <Award size={14} /> Dynamic Challenges
            </h3>
            
            <div className="flex flex-col gap-4">
              {activeMissions.map((m) => (
                <div 
                  key={m.id}
                  className={`p-4 rounded-lg border bg-black/30 flex flex-col gap-2.5 transition-all ${
                    m.completed 
                      ? 'border-green-500/30 bg-green-950/5' 
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className={`display-font text-xs font-bold leading-snug ${m.completed ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                      {m.description}
                    </span>
                    <span className="display-font text-xs font-bold text-[#ffe600] text-glow-yellow whitespace-nowrap">
                      +{m.reward} 💎
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                      <span>Progress</span>
                      <span className={m.completed ? 'text-[#39ff14] font-bold' : ''}>
                        {m.completed ? 'COMPLETED' : `${m.current} / ${m.target}`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          m.completed 
                            ? 'bg-[#39ff14] shadow-[0_0_4px_#39ff14]' 
                            : 'bg-gradient-to-r from-purple-600 to-indigo-400'
                        }`}
                        style={{ width: `${(m.current / m.target) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-[9px] text-gray-500 text-center mt-6 uppercase tracking-widest leading-relaxed">
              Missions regenerate automatically upon starting a new engines sequence.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
