interface RobotIconProps {
  className?: string;
  size?: number;
  bgFill?: string;
  robotColor?: string;
  hasBackground?: boolean;
}

export function RobotIcon({
  className = 'w-6 h-6',
  size,
  bgFill = '#0066f5',
  robotColor = '#ffffff',
  hasBackground = false,
}: RobotIconProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {hasBackground && (
        <rect width="512" height="512" rx="112" fill={bgFill} />
      )}

      <g transform="translate(256, 260)">
        {/* Antenna */}
        <circle cx="0" cy="-155" r="14" fill={robotColor} />
        <rect x="-5" y="-142" width="10" height="28" rx="4" fill={robotColor} />

        {/* Ears */}
        <rect x="-132" y="-35" width="26" height="70" rx="13" fill={robotColor} />
        <rect x="106" y="-35" width="26" height="70" rx="13" fill={robotColor} />

        {/* Head Outer Frame */}
        <rect x="-115" y="-95" width="230" height="190" rx="75" fill={robotColor} />

        {/* Face Screen Cutout */}
        <rect
          x="-82"
          y="-62"
          width="164"
          height="124"
          rx="46"
          fill={hasBackground ? bgFill : 'currentColor'}
          className={hasBackground ? '' : 'fill-blue-600'}
        />

        {/* Eyes */}
        <ellipse cx="-34" cy="0" rx="11" ry="18" fill={robotColor} />
        <ellipse cx="34" cy="0" rx="11" ry="18" fill={robotColor} />
      </g>
    </svg>
  );
}
