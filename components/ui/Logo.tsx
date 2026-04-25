import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export default function Logo({
  variant = 'dark',
  size = 32,
  showWordmark = true,
  className,
}: LogoProps) {
  const isDark = variant === 'dark';
  const gold = '#C9A84C';
  const dark = '#1A2B1F';
  const cream = '#F7F4EE';

  const markColor = isDark ? gold : dark;
  const textColor = isDark ? cream : dark;

  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.44;

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Pooled Wealth"
      >
        {/* Thin circle frame */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={markColor}
          strokeWidth={s * 0.045}
          fill={isDark ? 'rgba(201,168,76,0.07)' : 'rgba(26,43,31,0.05)'}
        />
        {/* PW monogram as SVG text — always crisp, never looks like UI */}
        <text
          x={cx}
          y={cy + s * 0.115}
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', 'Georgia', serif"
          fontWeight="700"
          fontSize={s * 0.38}
          fill={markColor}
          letterSpacing="-0.5"
        >
          PW
        </text>
      </svg>

      {showWordmark && (
        <span
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 700,
            fontSize: `${s * 0.5}px`,
            lineHeight: 1,
            letterSpacing: '-0.01em',
            color: textColor,
          }}
        >
          Pooled Wealth
        </span>
      )}
    </div>
  );
}
