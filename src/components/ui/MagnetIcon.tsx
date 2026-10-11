export interface MagnetIconProps {
  size?: number;
  className?: string;
}

/** Angular horseshoe matching the faceted in-game magnet power-up; stroke takes the surrounding text color */
export default function MagnetIcon({ size = 24, className }: MagnetIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 3h5v10l3 3 3-3V3h5v11l-5 6h-6l-5-6Z" />
      <path d="M4 7.5h5M15 7.5h5" />
    </svg>
  );
}
