import { trustScoreColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * TrustScore — circular score ring with animated fill.
 * Displays the trust score (0–100) from ReputationRegistry.
 *
 * @param {number} score      - Trust score 0–100
 * @param {string} size       - 'sm' | 'md' (default) | 'lg'
 * @param {boolean} showLabel - Whether to show the "Trust Score" label below
 */
export default function TrustScore({ score = 0, size = 'md', showLabel = true }) {
  // SVG circle math
  const dims    = { sm: 64,  md: 96,  lg: 128  };
  const strokes = { sm: 6,   md: 8,   lg: 10   };
  const texts   = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };

  const d   = dims[size];
  const sw  = strokes[size];
  const r   = (d - sw) / 2;
  const c   = d / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(Math.max(score, 0), 100);
  const dash = (pct / 100) * circ;

  // Semantic colour based on score — preserved for meaningful communication
  const colorMap = {
    green:  '#22c55e',  // 80+ = trustworthy
    teal:   '#14b8a6',  // 60–79 = good
    amber:  '#f59e0b',  // 40–59 = moderate
    red:    '#ef4444',  // <40 = risky
  };
  const color =
    pct >= 80 ? colorMap.green  :
    pct >= 60 ? colorMap.teal   :
    pct >= 40 ? colorMap.amber  :
    colorMap.red;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: d, height: d }}>
        <svg width={d} height={d} className="-rotate-90">
          {/* Track */}
          <circle
            cx={c} cy={c} r={r}
            fill="none"
            stroke="#FFE5BF"
            strokeWidth={sw}
            className="dark:opacity-30"
          />
          {/* Fill */}
          <circle
            cx={c} cy={c} r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 1s ease-out' }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold tabular-nums', texts[size], trustScoreColor(pct))}>
            {pct}
          </span>
        </div>
      </div>
      {showLabel && (
        <p className="text-xs font-medium text-[#9A7F65] dark:text-[#6B5A4A] tracking-wide uppercase">
          Trust Score
        </p>
      )}
    </div>
  );
}
