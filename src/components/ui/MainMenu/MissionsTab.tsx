import { useGameStore } from '../../../store/useGameStore';
import { Award } from 'lucide-react';

export default function MissionsTab() {
  const activeMissions = useGameStore((state) => state.activeMissions);

  return (
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
  );
}
