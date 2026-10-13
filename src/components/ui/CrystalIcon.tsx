export interface CrystalIconProps {
  size?: number;
  className?: string;
}

/** Brilliant-cut gem matching the in-game crystal; takes its color from the surrounding text color */
export default function CrystalIcon({ size = 16, className }: CrystalIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`inline-block shrink-0 ${className ?? ''}`} aria-hidden="true">
      <path d="M6 3h12l4 6-10 13L2 9Z" fill="currentColor" fillOpacity={0.22} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
      <path d="M11 3 8 9l4 13 4-13-3-6M2 9h20" stroke="currentColor" strokeWidth={1.3} strokeOpacity={0.85} strokeLinejoin="round" />
      <path d="M7.5 4.5 10 4.5 8 8Z" fill="#fff" />
    </svg>
  );
}
