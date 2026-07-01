import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { audioManager } from '../../utils/audio';
import { SKINS, UPGRADE_NODES } from '../../config/gameConfig';
import { 
  Volume2, 
  VolumeX, 
  Keyboard, 
  MousePointerClick, 
  Award, 
  Rocket, 
  Wrench, 
  Palette,
  Lock,
  Cpu
} from 'lucide-react';

function ShipSvgIcon({ id, color }: { id: string; color: string }) {
  if (id === 'pink') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}>
        <path d="M50,15 L65,60 L50,48 L35,60 Z" fill={`${color}20`} />
        <path d="M35,42 L10,65 L35,58" />
        <path d="M65,42 L90,65 L65,58" />
        <ellipse cx="50" cy="38" rx="3.5" ry="9" fill={color} />
      </svg>
    );
  }
  if (id === 'cyan') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}>
        <path d="M42,35 L42,10 L47,24 L50,24 L53,24 L58,10 L58,35" />
        <path d="M42,35 L50,55 L58,35 Z" fill={`${color}20`} />
        <path d="M42,42 C25,40 15,55 15,70 C25,65 42,54 42,54" />
        <path d="M58,42 C75,40 85,55 85,70 C75,65 58,54 58,54" />
        <ellipse cx="50" cy="38" rx="4" ry="10" fill={color} />
      </svg>
    );
  }
  if (id === 'yellow') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}>
        <path d="M38,25 L50,15 L62,25 L62,55 L50,65 L38,55 Z" fill={`${color}20`} />
        <path d="M38,30 L8,30 L8,50 L38,50 M18,30 L18,50 M28,30 L28,50" />
        <path d="M62,30 L92,30 L92,50 M82,30 L82,50 M72,30 L72,50" />
        <polygon points="45,30 55,30 55,42 45,42" fill={color} />
      </svg>
    );
  }
  if (id === 'green') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}>
        <path d="M50,12 C40,20 37,40 37,55 C43,58 50,60 50,60 C50,60 57,58 63,55 C63,40 60,20 50,12 Z" fill={`${color}15`} />
        <path d="M37,45 C24,48 8,60 10,72 C16,65 29,58 37,55" />
        <path d="M63,45 C76,48 92,60 90,72 C84,65 71,58 63,55" />
        <circle cx="44" cy="28" r="2.5" fill={color} stroke="none" />
        <circle cx="56" cy="28" r="2.5" fill={color} stroke="none" />
        <path d="M50,22 C48,26 50,38 50,42" strokeWidth="1.5" />
      </svg>
    );
  }
  if (id === 'purple') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}>
        <path d="M50,15 L64,45 L50,60 L36,45 Z" fill={`${color}20`} />
        <path d="M36,40 L6,55 L36,50" />
        <path d="M64,40 L94,55 L64,50" />
        <circle cx="18" cy="50" r="6.5" strokeWidth="1.5" />
        <circle cx="82" cy="50" r="6.5" strokeWidth="1.5" />
        <path d="M46,30 L54,30 L56,40 L44,40 Z" fill={color} />
      </svg>
    );
  }
  if (id === 'vortex') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}>
        <path d="M50,8 L53,46 L47,46 Z" fill={color} />
        <circle cx="50" cy="50" r="11" fill={`${color}15`} />
        <polygon points="50,41 58,45 58,55 50,59 42,55 42,45" strokeWidth="1.5" />
        <path d="M33,33 C12,43 12,57 33,67" />
        <path d="M67,33 C88,43 88,57 67,67" />
      </svg>
    );
  }
  if (id === 'quantum') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}>
        <path d="M35,25 L50,17 L65,25 L65,65 L35,65 Z" fill={`${color}20`} />
        <path d="M35,35 L10,22 L10,48 L35,52" />
        <path d="M64,35 L88,22 L88,48 L64,52" />
        <path d="M40,31 L60,31" stroke="#ff0000" strokeWidth="1.8" />
      </svg>
    );
  }
  if (id === 'temporal') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}>
        <path d="M45,30 L45,12 L49,24 M55,30 L55,12 L51,24" />
        <path d="M41,28 L50,22 L59,28 L63,55 L50,62 L37,55 Z" fill={`${color}20`} />
        <path d="M37,42 L10,50 L37,52" />
        <path d="M63,42 L90,50 L63,52" />
        <circle cx="10" cy="50" r="7" strokeWidth="1.5" />
        <line x1="10" y1="43" x2="10" y2="57" strokeWidth="1" />
        <line x1="3" y1="50" x2="17" y2="50" strokeWidth="1" />
        <circle cx="90" cy="50" r="7" strokeWidth="1.5" />
        <line x1="90" y1="43" x2="90" y2="57" strokeWidth="1" />
        <line x1="83" y1="50" x2="97" y2="50" strokeWidth="1" />
        <circle cx="50" cy="38" r="4.5" fill={color} />
      </svg>
    );
  }
  return null;
}

export default function MainMenu() {
  const activeTab = useGameStore((state) => state.menuTab);
  const setActiveTab = useGameStore((state) => state.setMenuTab);
  const [garageTab, setGarageTab] = useState<'SHIPS' | 'UPGRADES' | 'VISUALS'>('SHIPS');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const renderConnector = (sourceNodeId: string, color: string) => {
    const isSourceUnlocked = upgrades[sourceNodeId as keyof typeof upgrades];
    return (
      <div className="flex items-center justify-center w-8 shrink-0">
        <div 
          className="h-[2px] w-full transition-all duration-300"
          style={{ 
            backgroundColor: isSourceUnlocked ? color : 'rgba(255, 255, 255, 0.08)',
            boxShadow: isSourceUnlocked ? `0 0 8px ${color}` : 'none'
          }}
        />
      </div>
    );
  };

  const renderNode = (nodeId: string) => {
    const node = UPGRADE_NODES.find(n => n.id === nodeId);
    if (!node) return null;

    const isUnlocked = upgrades[node.id as keyof typeof upgrades];
    const hasPrereq = !node.prerequisite || upgrades[node.prerequisite as keyof typeof upgrades];
    const canAfford = lifetimeCrystals >= node.cost;

    // Get branch colors
    const colors = {
      DEFENSE: { primary: '#ff007f', border: 'border-[#ff007f]', bg: 'bg-[#ff007f]/10', shadow: 'shadow-[0_0_8px_rgba(255,0,127,0.25)]' },
      HARVESTING: { primary: '#00f3ff', border: 'border-[#00f3ff]', bg: 'bg-[#00f3ff]/10', shadow: 'shadow-[0_0_8px_rgba(0,243,255,0.25)]' },
      ENGINE: { primary: '#ffe600', border: 'border-[#ffe600]', bg: 'bg-[#ffe600]/10', shadow: 'shadow-[0_0_8px_rgba(255,230,0,0.25)]' }
    }[node.branch as 'DEFENSE' | 'HARVESTING' | 'ENGINE'] || { primary: '#ffffff', border: 'border-white', bg: 'bg-white/10', shadow: '' };

    let cardStyle = 'border-white/5 bg-black/40 text-gray-600 cursor-not-allowed';
    if (isUnlocked) {
      cardStyle = `${colors.border} ${colors.bg} ${colors.shadow} text-white cursor-pointer`;
    } else if (hasPrereq) {
      if (canAfford) {
        cardStyle = `border-[#00f3ff]/40 bg-[#00f3ff]/5 text-cyan-400 hover:border-[#00f3ff] hover:text-white cursor-pointer hover:shadow-[0_0_6px_rgba(0,243,255,0.2)] animate-pulse`;
      } else {
        cardStyle = `border-white/10 bg-black/20 text-gray-400 cursor-pointer hover:border-white/20`;
      }
    }

    const handleClick = () => {
      if (isUnlocked) return;
      if (!hasPrereq) return;
      if (!canAfford) return;
      buyUpgrade(node.id);
    };

    return (
      <div
        onClick={handleClick}
        onMouseEnter={() => setHoveredNode(node.id)}
        onMouseLeave={() => setHoveredNode(null)}
        className={`w-11 h-11 rounded-lg border flex flex-col items-center transition-all ${
          isUnlocked ? 'justify-center' : 'justify-between pt-2 pb-1'
        } ${cardStyle}`}
        style={{
          boxShadow: isUnlocked ? `0 0 10px ${colors.primary}40, inset 0 0 5px ${colors.primary}20` : undefined
        }}
      >
        {/* Node Icon */}
        <node.icon size={19} className={isUnlocked ? '' : 'opacity-70'} />
        
        {/* Cost / Status Indicator */}
        {!isUnlocked && (
          !hasPrereq ? (
            <Lock size={8} className="text-gray-600 mb-0.5" />
          ) : (
            <span className="text-[7.5px] font-bold text-gray-400 display-font leading-none">{node.cost}</span>
          )
        )}
      </div>
    );
  };

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
          className="display-font text-4xl md:text-5xl font-black mb-1 text-glow-magenta glitch text-center"
          data-text="AETHER WINGS"
          style={{ letterSpacing: '4px', color: '#ff007f' }}
        >
          AETHER WINGS
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

            {/* Garage Sub-Tabs */}
            <div className="flex gap-2 mb-5 w-full border-b border-white/5 pb-2.5">
              <button
                onClick={() => setGarageTab('SHIPS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 display-font text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  garageTab === 'SHIPS' 
                    ? 'border-[#ff007f] text-[#ff007f] bg-[#ff007f]/10 shadow-[0_0_8px_rgba(255,0,127,0.2)] text-glow-magenta' 
                    : 'border-white/5 text-gray-400 hover:text-white hover:border-white/20 bg-black/20'
                }`}
                style={{ borderRadius: '4px' }}
              >
                <Rocket size={12} />
                Ships
              </button>
              <button
                onClick={() => setGarageTab('UPGRADES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 display-font text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  garageTab === 'UPGRADES' 
                    ? 'border-[#00f3ff] text-[#00f3ff] bg-[#00f3ff]/10 shadow-[0_0_8px_rgba(0,243,255,0.2)] text-glow-cyan' 
                    : 'border-white/5 text-gray-400 hover:text-white hover:border-white/20 bg-black/20'
                }`}
                style={{ borderRadius: '4px' }}
              >
                <Wrench size={12} />
                Upgrades
              </button>
              <button
                onClick={() => setGarageTab('VISUALS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 display-font text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  garageTab === 'VISUALS' 
                    ? 'border-[#ffe600] text-[#ffe600] bg-[#ffe600]/10 shadow-[0_0_8px_rgba(255,230,0,0.2)] text-glow-yellow' 
                    : 'border-white/5 text-gray-400 hover:text-white hover:border-white/20 bg-black/20'
                }`}
                style={{ borderRadius: '4px' }}
              >
                <Palette size={12} />
                Visuals
              </button>
            </div>

            {/* 2.1 SHIPS SUB-TAB */}
            {garageTab === 'SHIPS' && (
              <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                {SKINS.filter(s => ['vortex', 'quantum', 'temporal'].includes(s.id)).map((skin) => {
                  const isUnlocked = upgrades.unlockedSkins.includes(skin.id);
                  const isEquipped = upgrades.equippedSkin === skin.id;

                  return (
                    <div 
                      key={skin.id}
                      onClick={() => isUnlocked ? equipSkin(skin.id) : buySkin(skin.id, skin.cost)}
                      className={`p-3.5 rounded-lg border flex justify-between items-center cursor-pointer transition-all ${
                        isEquipped
                          ? 'bg-[#ff007f]/5 border-[#ff007f] shadow-[0_0_8px_rgba(255,0,127,0.15)]'
                          : isUnlocked
                            ? 'bg-black/20 border-white/10 hover:border-cyan-400'
                            : 'bg-black/40 border-white/5 hover:border-yellow-400/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black/40 border border-white/10 rounded flex items-center justify-center p-1.5 flex-shrink-0">
                          <ShipSvgIcon id={skin.id} color={skin.color} />
                        </div>
                        <div className="flex flex-col">
                          <span className="display-font text-xs font-bold text-gray-200">{skin.name}</span>
                          <span className="text-[9px] text-gray-400 mt-0.5 leading-snug">{skin.description}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isEquipped ? (
                          <span className="text-[9px] uppercase font-black text-[#ff007f] tracking-wider text-glow-magenta">EQUIPPED</span>
                        ) : isUnlocked ? (
                          <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider">EQUIP</span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#ffe600] bg-yellow-950/20 border border-yellow-500/20 px-2 py-0.5 rounded">{skin.cost} 💎</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2.2 UPGRADES SUB-TAB */}
            {garageTab === 'UPGRADES' && (
              <div className="flex flex-col gap-3">
                {/* Connected Skill Tree Card Grid */}
                <div className="flex flex-col gap-3.5 bg-black/20 p-4 border border-white/5 rounded-xl">
                  {/* Defense Branch Row */}
                  <div className="flex items-center gap-4">
                    <div className="w-28 display-font text-[9px] font-black uppercase text-[#ff007f] tracking-widest text-glow-magenta shrink-0">
                      Defense
                    </div>
                    <div className="flex items-center gap-0">
                      {renderNode('defense_shield_1')}
                      {renderConnector('defense_shield_1', '#ff007f')}
                      {renderNode('defense_shield_2')}
                      {renderConnector('defense_shield_2', '#ff007f')}
                      {renderNode('defense_shield_3')}
                    </div>
                  </div>

                  {/* Harvesting Branch Row */}
                  <div className="flex items-center gap-4">
                    <div className="w-28 display-font text-[9px] font-black uppercase text-[#00f3ff] tracking-widest text-glow-cyan shrink-0">
                      Harvest
                    </div>
                    <div className="flex items-center gap-0">
                      {renderNode('harvest_magnet_1')}
                      {renderConnector('harvest_magnet_1', '#00f3ff')}
                      {renderNode('harvest_magnet_2')}
                      {renderConnector('harvest_magnet_2', '#00f3ff')}
                      {renderNode('harvest_magnet_3')}
                    </div>
                  </div>

                  {/* Engine Performance Row */}
                  <div className="flex items-center gap-4">
                    <div className="w-28 display-font text-[9px] font-black uppercase text-[#ffe600] tracking-widest text-glow-yellow shrink-0">
                      Engine
                    </div>
                    <div className="flex items-center gap-0">
                      {renderNode('engine_boost_1')}
                      {renderConnector('engine_boost_1', '#ffe600')}
                      {renderNode('engine_boost_2')}
                      {renderConnector('engine_boost_2', '#ffe600')}
                      {renderNode('engine_boost_3')}
                    </div>
                  </div>
                </div>

                {/* Tech Tree Details Panel (Hover Specs Terminal) */}
                <div className="p-3.5 glass-panel border border-white/10 bg-black/40 min-h-[105px] flex flex-col justify-center">
                  {hoveredNode ? (
                    (() => {
                      const node = UPGRADE_NODES.find(n => n.id === hoveredNode);
                      if (!node) return null;
                      
                      const isUnlocked = upgrades[node.id as keyof typeof upgrades];
                      const hasPrereq = !node.prerequisite || upgrades[node.prerequisite as keyof typeof upgrades];
                      const canAfford = lifetimeCrystals >= node.cost;
                      
                      let statusText: string;
                      let statusColor: string;
                      if (isUnlocked) {
                        statusText = 'ACTIVE';
                        statusColor = 'text-[#39ff14] text-glow-green';
                      } else if (!hasPrereq) {
                        const prereqNode = UPGRADE_NODES.find(n => n.id === node.prerequisite);
                        statusText = `LOCKED: REQUIRES ${prereqNode?.name.toUpperCase()}`;
                        statusColor = 'text-red-500';
                      } else if (!canAfford) {
                        statusText = `INSUFFICIENT CRYSTALS: REQUIRES ${node.cost} 💎`;
                        statusColor = 'text-[#ffe600] text-glow-yellow';
                      } else {
                        statusText = `READY FOR INTEGRATION: INSTALL FOR ${node.cost} 💎`;
                        statusColor = 'text-[#00f3ff] text-glow-cyan';
                      }

                      return (
                        <>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="display-font text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                              <node.icon size={13} className={node.branch === 'DEFENSE' ? 'text-[#ff007f]' : node.branch === 'HARVESTING' ? 'text-[#00f3ff]' : 'text-[#ffe600]'} />
                              {node.name}
                            </span>
                            <span className={`display-font text-[9px] font-black tracking-widest ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-300 leading-snug">{node.description}</p>
                          <div className="text-[8px] uppercase font-bold text-gray-500 mt-1.5 display-font tracking-wider">
                            System Effect: {node.effectLabel}
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-center text-[10px] uppercase font-bold tracking-widest text-gray-500 display-font animate-pulse">
                      [ HOVER OVER A TECH NODE TO ANALYZE SYSTEM SPECIFICATIONS ]
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2.3 VISUALS SUB-TAB */}
            {garageTab === 'VISUALS' && (
              <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                {SKINS.filter(s => ['pink', 'cyan', 'yellow', 'green', 'purple'].includes(s.id)).map((skin) => {
                  const isUnlocked = upgrades.unlockedSkins.includes(skin.id);
                  const isEquipped = upgrades.equippedSkin === skin.id;

                  return (
                    <div 
                      key={skin.id}
                      onClick={() => isUnlocked ? equipSkin(skin.id) : buySkin(skin.id, skin.cost)}
                      className={`p-2.5 rounded-lg border flex justify-between items-center cursor-pointer transition-all ${
                        isEquipped
                          ? 'bg-white/10 border-[#ffe600] shadow-[0_0_6px_rgba(255,230,0,0.15)]'
                          : isUnlocked
                            ? 'bg-black/20 border-white/10 hover:border-cyan-400'
                            : 'bg-black/40 border-white/5 hover:border-yellow-400/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-black/40 border border-white/10 rounded flex items-center justify-center p-1 flex-shrink-0">
                          <ShipSvgIcon id={skin.id} color={skin.color} />
                        </div>
                        <span className="display-font text-xs font-semibold text-gray-200">{skin.name}</span>
                      </div>
                      <div className="flex-shrink-0">
                        {isEquipped ? (
                          <span className="text-[9px] uppercase font-black text-[#ffe600] tracking-wider text-glow-yellow">EQUIPPED</span>
                        ) : isUnlocked ? (
                          <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider">EQUIP</span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#ffe600]">{skin.cost} 💎</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. MISSIONS TAB */}
        {activeTab === 'MISSIONS' && (
          <div className="flex flex-col w-full text-left">
            <h3 className="display-font text-xs font-black uppercase text-[#ffe600] tracking-wider mb-4 border-b border-[#ffe600]/20 pb-1.5 flex items-center gap-1.5">
              <Award size={12} /> Dynamic Challenges
            </h3>
            
            <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-1">
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
