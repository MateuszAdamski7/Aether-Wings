export default function ShipSvgIcon({ id, color }: { id: string; color: string }) {
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
