import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { audioManager } from '../../utils/audio';
import { SKINS, UPGRADE_NODES, type UpgradeNode } from '../../config/gameConfig';
import { Cpu } from 'lucide-react';

import { musicPlayer } from '../../utils/musicPlayer';
import CrystalIcon from './CrystalIcon';
import VolumeControl from './VolumeControl';

type MenuTab = 'PLAY' | 'GARAGE' | 'MISSIONS';

const MENU_TABS: { id: MenuTab; label: string; color: string }[] = [
  { id: 'PLAY', label: 'Launch', color: '#00f3ff' },
  { id: 'GARAGE', label: 'Garage', color: '#ff4da6' },
  { id: 'MISSIONS', label: 'Missions', color: '#ffe600' },
];

interface BranchStyle {
  label: string;
  color: string;
  glow: string;
  glowClass: string;
}

const BRANCH_STYLES: Record<UpgradeNode['branch'], BranchStyle> = {
  DEFENSE: { label: 'Defense', color: '#ff4da6', glow: 'rgba(255, 0, 127, 0.32)', glowClass: 'holo-glow-magenta' },
  HARVESTING: { label: 'Harvest', color: '#00f3ff', glow: 'rgba(0, 243, 255, 0.28)', glowClass: 'holo-glow-cyan' },
  ENGINE: { label: 'Engine', color: '#ffe600', glow: 'rgba(255, 230, 0, 0.25)', glowClass: 'holo-glow-yellow' },
};

const UPGRADE_BRANCHES: { branch: UpgradeNode['branch']; nodes: UpgradeNode['id'][] }[] = [
  { branch: 'DEFENSE', nodes: ['defense_shield_1', 'defense_shield_2', 'defense_shield_3'] },
  { branch: 'HARVESTING', nodes: ['harvest_magnet_1', 'harvest_magnet_2', 'harvest_magnet_3'] },
  { branch: 'ENGINE', nodes: ['engine_boost_1', 'engine_boost_2', 'engine_boost_3'] },
];


function ShipSvgIcon({ id, color }: { id: string; color: string }) {
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
  const [garageTab, setGarageTab] = useState<'SHIPS' | 'UPGRADES'>('SHIPS');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const startGame = useGameStore((state) => state.startGame);
  const sceneReady = useGameStore((state) => state.sceneReady);
  const highScore = useGameStore((state) => state.highScore);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const setGraphicsQuality = useGameStore((state) => state.setGraphicsQuality);

  // Shop states
  const lifetimeCrystals = useGameStore((state) => state.lifetimeCrystals);
  const upgrades = useGameStore((state) => state.upgrades);
  const buyUpgrade = useGameStore((state) => state.buyUpgrade);
  const buySkin = useGameStore((state) => state.buySkin);
  const equipSkin = useGameStore((state) => state.equipSkin);

  // Mission states
  const activeMissions = useGameStore((state) => state.activeMissions);

  const activeTabIndex = MENU_TABS.findIndex((tab) => tab.id === activeTab);

  const isNodeUnlocked = (nodeId: string) => Boolean(upgrades[nodeId as keyof typeof upgrades]);

  const toggleGraphics = () => {
    const nextQuality = graphicsQuality === 'HIGH' ? 'LOW' : 'HIGH';
    setGraphicsQuality(nextQuality);
    audioManager.playStartFx();
  };

  const handleStart = () => {
    musicPlayer.start();
    audioManager.playStartFx();
    startGame();
  };

  const renderConnector = (sourceNodeId: string, targetNodeId: string, color: string) => {
    let background = 'rgba(255, 255, 255, 0.18)';
    let boxShadow = 'none';
    if (isNodeUnlocked(sourceNodeId)) {
      background = isNodeUnlocked(targetNodeId) ? color : `linear-gradient(90deg, ${color}, rgba(255, 255, 255, 0.25))`;
      boxShadow = isNodeUnlocked(targetNodeId) ? `0 0 6px ${color}` : 'none';
    }
    return <div className="h-px w-5 sm:w-12 mt-7 shrink-0 transition-all duration-300" style={{ background, boxShadow }} />;
  };

  const renderNode = (nodeId: string) => {
    const node = UPGRADE_NODES.find(n => n.id === nodeId);
    if (!node) return null;

    const branch = BRANCH_STYLES[node.branch];
    const isUnlocked = isNodeUnlocked(node.id);
    const hasPrereq = !node.prerequisite || isNodeUnlocked(node.prerequisite);
    const canAfford = lifetimeCrystals >= node.cost;
    const isSelected = hoveredNode === node.id;

    let iconColor = 'rgba(255, 255, 255, 0.3)';
    let iconBackground = 'none';
    let iconFilter = 'none';
    if (isSelected) {
      iconColor = '#ffffff';
      iconBackground = 'radial-gradient(circle, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0) 70%)';
      iconFilter = `drop-shadow(0 0 8px ${branch.color})`;
    } else if (isUnlocked) {
      iconColor = branch.color;
      iconBackground = `radial-gradient(circle, ${branch.glow}, transparent 70%)`;
      iconFilter = `drop-shadow(0 0 6px ${branch.color})`;
    } else if (hasPrereq) {
      iconColor = branch.color;
    }

    let caption = String(node.cost);
    let captionClass = 'text-white/40 holo-shadow';
    if (isUnlocked) {
      caption = 'ACTIVE';
      captionClass = 'text-[#3dffa8] holo-shadow';
    } else if (hasPrereq) {
      captionClass = canAfford ? 'text-[#ffe600] holo-glow-yellow' : 'text-white/60 holo-shadow';
    }

    const handleClick = () => {
      setHoveredNode(node.id); // Touch screens have no hover, so a tap also shows the details
      if (isUnlocked) return;
      if (!hasPrereq) return;
      if (!canAfford) return;
      buyUpgrade(node.id);
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setHoveredNode(node.id)}
        onMouseLeave={() => setHoveredNode(null)}
        className={`w-14 sm:w-[84px] flex flex-col items-center gap-1.5 bg-transparent border-0 p-0 shrink-0 ${
          hasPrereq && !isUnlocked ? 'cursor-pointer' : isUnlocked ? 'cursor-default' : 'cursor-not-allowed'
        } ${hasPrereq && !isUnlocked && canAfford && !isSelected ? 'animate-pulse' : ''}`}
        aria-label={`${node.name}: ${isUnlocked ? 'active' : `${node.cost} crystals`}`}
      >
        <span
          className="w-14 h-14 rounded-full grid place-items-center transition-all duration-200"
          style={{ color: iconColor, background: iconBackground, filter: iconFilter }}
        >
          <node.icon size={24} />
        </span>
        <span className={`display-font text-[10px] font-bold tracking-[0.14em] flex items-center gap-1 ${captionClass}`}>
          {caption}
          {!isUnlocked && <CrystalIcon size={10} />}
        </span>
      </button>
    );
  };

  const renderNodeDetails = () => {
    const node = UPGRADE_NODES.find(n => n.id === hoveredNode);
    if (!node) {
      return (
        <span className="holo-label holo-shadow text-white/45">Hover or tap a node to inspect it</span>
      );
    }

    const isUnlocked = isNodeUnlocked(node.id);
    const hasPrereq = !node.prerequisite || isNodeUnlocked(node.prerequisite);
    const canAfford = lifetimeCrystals >= node.cost;

    let statusText: string;
    let statusClass: string;
    let showsCost = false;
    if (isUnlocked) {
      statusText = 'Active';
      statusClass = 'text-[#3dffa8] holo-glow-green';
    } else if (!hasPrereq) {
      const prereqNode = UPGRADE_NODES.find(n => n.id === node.prerequisite);
      statusText = `Locked · requires ${prereqNode?.name ?? 'previous node'}`;
      statusClass = 'text-[#ff2d6a] holo-shadow';
    } else if (!canAfford) {
      statusText = `Requires ${node.cost}`;
      showsCost = true;
      statusClass = 'text-[#ffe600] holo-glow-yellow';
    } else {
      statusText = `Ready · install for ${node.cost}`;
      showsCost = true;
      statusClass = 'text-[#00f3ff] holo-glow-cyan';
    }

    return (
      <>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="display-font font-extrabold text-sm sm:text-[15px] uppercase tracking-[0.14em] holo-shadow">{node.name}</span>
          <span className={`holo-label flex items-center gap-1.5 ${statusClass}`}>
            {statusText}
            {showsCost && <CrystalIcon size={12} />}
          </span>
        </div>
        <p className="m-0 text-base leading-snug text-white/80 holo-shadow">{node.description}</p>
        <span className="holo-label holo-shadow text-white/50">Effect · {node.effectLabel}</span>
      </>
    );
  };

  return (
    <div className="absolute inset-0 z-10 select-none">
      <div className="holo-scrim" />

      <div className="relative h-full flex flex-col hud-container">
        {/* Top bar: wallet & settings */}
        <div className="flex justify-between items-center w-full shrink-0">
          <div className="flex items-center gap-2.5">
            <CrystalIcon size={16} className="text-[#ff3d9e] drop-shadow-[0_0_5px_#ff007f]" />
            <span className="holo-num holo-glow-magenta text-lg text-[#ff4da6]">{lifetimeCrystals.toLocaleString()}</span>
            <span className="holo-label holo-shadow text-white/55">Crystals</span>
          </div>

          <div className="flex">
            {/* Graphics Quality Toggle */}
            <button
              onClick={toggleGraphics}
              className={`holo-icon-btn ${graphicsQuality === 'HIGH' ? '!text-[#ff4da6]' : '!text-[#00f3ff]'}`}
              title={graphicsQuality === 'HIGH' ? 'Switch to Performance Mode (Runs cooler)' : 'Switch to High Quality Graphics'}
              aria-label="Graphics quality"
            >
              <Cpu size={20} />
            </button>

            <VolumeControl />
          </div>
        </div>

        {/* Fixed header: the title and tabs stay in place on every tab */}
        <div className="shrink-0 flex flex-col items-center pointer-events-auto">
          <h1 className="display-font font-black text-center text-[#e9fdff] holo-glow-cyan m-0 tracking-[0.2em] pl-[0.2em] text-3xl sm:text-5xl md:text-[56px] mt-4 md:mt-8">
            AETHER WINGS
          </h1>

          {/* Tab Selection */}
          <nav className="flex gap-4 sm:gap-11 mt-3 md:mt-5">
            {MENU_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex flex-col items-center gap-2 px-1.5 py-3 min-h-11 bg-transparent border-0 cursor-pointer display-font text-xs sm:text-[13px] font-semibold uppercase tracking-[0.28em] holo-shadow transition-colors hover:!text-white"
                  style={{ color: isActive ? tab.color : 'rgba(255, 255, 255, 0.55)' }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                  <span
                    className="w-[5px] h-[5px] rounded-full"
                    style={isActive ? { background: tab.color, boxShadow: `0 0 8px ${tab.color}` } : undefined}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab gallery: the panes sit side by side and the strip slides to the active one */}
        <div className="flex-1 min-h-0 overflow-hidden pointer-events-auto">
          <div className="menu-carousel" style={{ transform: `translateX(-${activeTabIndex * 100}%)` }}>
            {/* 1. PLAY TAB */}
            <section className="menu-pane" data-active={activeTab === 'PLAY'} inert={activeTab !== 'PLAY'} aria-label="Launch">
              <div className="flex flex-col items-center w-full text-center my-auto py-6">
                <span className="holo-label holo-shadow text-white/60">Personal best</span>
                <span className="holo-num holo-glow-cyan text-4xl sm:text-[52px] mt-2">{highScore.toLocaleString()}</span>

                <button
                  onClick={handleStart}
                  disabled={!sceneReady}
                  className="holo-cta holo-glow-cyan text-white hover:text-[#00f3ff] mt-8 sm:mt-10"
                >
                  {sceneReady ? '›› START ENGINES ‹‹' : 'LOADING ENGINE…'}
                </button>

                <div className="holo-label holo-shadow text-white/55 mt-3 flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${sceneReady ? 'bg-[#3dffa8] shadow-[0_0_8px_#3dffa8]' : 'bg-[#ffe600] animate-pulse'}`}
                  />
                  {sceneReady ? 'System ready' : 'Warming up'}
                </div>
              </div>

              <div className="shrink-0 flex flex-wrap justify-center gap-x-10 gap-y-1 pt-3 text-[15px] font-semibold tracking-[0.06em] text-white/70 holo-shadow text-center">
                <span className="pointer-coarse:hidden">
                  <b className="display-font text-[#00f3ff]">A / D</b> or <b className="display-font text-[#00f3ff]">← / →</b> change lanes
                </span>
                <span className="pointer-coarse:hidden"><b className="display-font text-[#00f3ff]">SPACE</b> hyperboost</span>
                <span className="pointer-coarse:hidden"><b className="display-font text-[#00f3ff]">ESC</b> pause</span>
                <span className="hidden pointer-coarse:inline">
                  <b className="display-font text-[#00f3ff]">Swipe</b> to change lanes · tap <b className="display-font text-[#00f3ff]">BOOST</b> when charged
                </span>
              </div>
            </section>

            {/* 2. GARAGE TAB */}
            <section className="menu-pane" data-active={activeTab === 'GARAGE'} inert={activeTab !== 'GARAGE'} aria-label="Garage">
              <div className="flex flex-col w-full max-w-[760px] text-left mt-6 md:mt-10">
                {/* Garage Sub-Tabs */}
                <div className="flex gap-9 px-5 mb-3">
                  <button
                    onClick={() => setGarageTab('SHIPS')}
                    className={`flex flex-col gap-1.5 py-2.5 min-h-11 bg-transparent border-0 cursor-pointer display-font text-[11px] font-bold uppercase tracking-[0.26em] transition-colors hover:!text-white ${
                      garageTab === 'SHIPS' ? 'text-[#ff4da6] holo-glow-magenta' : 'text-white/50 holo-shadow'
                    }`}
                  >
                    Ships
                    <span className={`h-px w-full ${garageTab === 'SHIPS' ? 'bg-[#ff007f] shadow-[0_0_8px_#ff007f]' : ''}`} />
                  </button>
                  <button
                    onClick={() => setGarageTab('UPGRADES')}
                    className={`flex flex-col gap-1.5 py-2.5 min-h-11 bg-transparent border-0 cursor-pointer display-font text-[11px] font-bold uppercase tracking-[0.26em] transition-colors hover:!text-white ${
                      garageTab === 'UPGRADES' ? 'text-[#00f3ff] holo-glow-cyan' : 'text-white/50 holo-shadow'
                    }`}
                  >
                    Upgrades
                    <span className={`h-px w-full ${garageTab === 'UPGRADES' ? 'bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]' : ''}`} />
                  </button>
                </div>

                {/* 2.1 SHIPS SUB-TAB */}
                {garageTab === 'SHIPS' && (
                  <div className="flex flex-col">
                    {SKINS.filter(s => ['vortex', 'quantum', 'temporal'].includes(s.id)).map((skin) => {
                      const isUnlocked = upgrades.unlockedSkins.includes(skin.id);
                      const isEquipped = upgrades.equippedSkin === skin.id;

                      return (
                        <button
                          key={skin.id}
                          onClick={() => isUnlocked ? equipSkin(skin.id) : buySkin(skin.id, skin.cost)}
                          className="group grid grid-cols-[48px_minmax(0,1fr)_auto] sm:grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 sm:gap-5 px-4 sm:px-5 py-4 w-full text-left bg-transparent border-0 cursor-pointer text-white"
                          style={isEquipped ? { background: 'linear-gradient(90deg, rgba(255, 0, 127, 0.14), rgba(255, 0, 127, 0) 75%)' } : undefined}
                        >
                          <span className={`w-12 h-12 justify-self-center ${isUnlocked ? '' : 'opacity-55'}`}>
                            <ShipSvgIcon id={skin.id} color={skin.color} />
                          </span>
                          <span className="flex flex-col gap-1">
                            <span className={`display-font font-extrabold text-sm sm:text-base uppercase tracking-[0.12em] holo-shadow transition-colors group-hover:text-[#00f3ff] ${isUnlocked ? '' : 'text-white/75'}`}>
                              {skin.name}
                            </span>
                            <span className={`text-sm sm:text-base holo-shadow ${isUnlocked ? 'text-white/70' : 'text-white/55'}`}>{skin.description}</span>
                          </span>
                          {isEquipped ? (
                            <span className="holo-label holo-glow-magenta text-[11px] text-[#ff4da6]">Equipped</span>
                          ) : isUnlocked ? (
                            <span className="holo-label holo-glow-cyan text-[11px] text-[#00f3ff]">Equip</span>
                          ) : (
                            <span className="holo-num holo-glow-yellow text-[15px] text-[#ffe600] flex items-center gap-1.5">{skin.cost} <CrystalIcon size={15} className="drop-shadow-[0_0_4px_#ffe600]" /></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2.2 UPGRADES SUB-TAB */}
                {garageTab === 'UPGRADES' && (
                  <div className="flex flex-col px-4 sm:px-5">
                    <div className="flex flex-col gap-2.5">
                      {UPGRADE_BRANCHES.map(({ branch, nodes }) => {
                        const style = BRANCH_STYLES[branch];
                        return (
                          <div key={branch} className="flex items-start">
                            <span
                              className={`w-20 sm:w-32 pt-5 shrink-0 display-font text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.3em] ${style.glowClass}`}
                              style={{ color: style.color }}
                            >
                              {style.label}
                            </span>
                            {nodes.map((nodeId, i) => (
                              <div key={nodeId} className="flex items-start">
                                {i > 0 && renderConnector(nodes[i - 1], nodeId, style.color)}
                                {renderNode(nodeId)}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected node readout */}
                    <div className="mt-5 flex flex-col gap-1.5 max-w-[620px] min-h-[96px]">
                      {renderNodeDetails()}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 3. MISSIONS TAB */}
            <section className="menu-pane" data-active={activeTab === 'MISSIONS'} inert={activeTab !== 'MISSIONS'} aria-label="Missions">
              <div className="flex flex-col w-full max-w-[600px] text-left mt-6 md:mt-10 px-1">
                <span className="holo-label holo-glow-yellow text-[11px] text-[#ffe600]">Dynamic challenges</span>

                <div className="flex flex-col gap-8 mt-8">
                  {activeMissions.map((m) => (
                    <div key={m.id} className="flex flex-col gap-2.5">
                      <div className="flex justify-between items-baseline gap-5">
                        <span
                          className={`display-font font-bold text-[13px] sm:text-[15px] uppercase tracking-[0.1em] holo-shadow ${
                            m.completed ? 'text-white/45 line-through' : 'text-white'
                          }`}
                        >
                          {m.description}
                        </span>
                        <span className={`holo-num text-sm whitespace-nowrap flex items-center gap-1.5 ${m.completed ? 'text-[#ffe600]/50 holo-shadow' : 'text-[#ffe600] holo-glow-yellow'}`}>
                          +{m.reward} <CrystalIcon size={14} />
                        </span>
                      </div>
                      <div className="holo-track">
                        <div
                          className={`h-full transition-all duration-300 ${
                            m.completed
                              ? 'bg-[#3dffa8] shadow-[0_0_8px_#3dffa8]'
                              : 'bg-gradient-to-r from-[#9d00ff] to-[#00f3ff] shadow-[0_0_8px_rgba(0,243,255,0.6)]'
                          }`}
                          style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%` }}
                        />
                      </div>
                      <span className={`holo-label self-end ${m.completed ? 'text-[#3dffa8] holo-glow-green' : 'text-white/60 holo-shadow'}`}>
                        {m.completed ? 'Completed' : `${m.current.toLocaleString()} / ${m.target.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <span className="shrink-0 mt-auto pt-6 holo-label holo-shadow text-white/45 text-center">
                Missions regenerate on every new launch
              </span>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
