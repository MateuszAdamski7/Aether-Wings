import { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { SKINS, UPGRADES } from '../../../config/gameConfig';
import { 
  Rocket, 
  Wrench, 
  Palette, 
  Lock, 
  Cpu, 
  Shield, 
  Layers, 
  ShieldAlert, 
  Magnet, 
  Sparkles, 
  Coins, 
  Gauge, 
  Zap, 
  Hourglass 
} from 'lucide-react';
import ShipSvgIcon from './ShipSvgIcon';

const UPGRADE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Shield,
  Layers,
  ShieldAlert,
  Magnet,
  Sparkles,
  Coins,
  Gauge,
  Zap,
  Hourglass
};

export default function GarageTab() {
  const [garageTab, setGarageTab] = useState<'SHIPS' | 'UPGRADES' | 'VISUALS'>('SHIPS');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const lifetimeCrystals = useGameStore((state) => state.lifetimeCrystals);
  const upgrades = useGameStore((state) => state.upgrades);
  const buyUpgrade = useGameStore((state) => state.buyUpgrade);
  const buySkin = useGameStore((state) => state.buySkin);
  const equipSkin = useGameStore((state) => state.equipSkin);

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
    const node = UPGRADES.find(n => n.id === nodeId);
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
        {(() => {
          const Icon = UPGRADE_ICONS[node.icon] || Cpu;
          return <Icon size={19} className={isUnlocked ? '' : 'opacity-70'} />;
        })()}
        
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

  return (
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

      {/* SHIPS SUB-TAB */}
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

      {/* UPGRADES SUB-TAB */}
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
                const node = UPGRADES.find(n => n.id === hoveredNode);
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
                  const prereqNode = UPGRADES.find(n => n.id === node.prerequisite);
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
                        {(() => {
                          const Icon = UPGRADE_ICONS[node.icon] || Cpu;
                          return <Icon size={13} className={node.branch === 'DEFENSE' ? 'text-[#ff007f]' : node.branch === 'HARVESTING' ? 'text-[#00f3ff]' : 'text-[#ffe600]'} />;
                        })()}
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

      {/* VISUALS SUB-TAB */}
      {garageTab === 'VISUALS' && (
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
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
  );
}
