'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'gold' | 'green' | 'blue';
}

export default function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  color = 'gold',
}: ProgressBarProps) {
  const percent = Math.min(Math.round((value / max) * 100), 100);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayed(percent), 60);
    return () => clearTimeout(t);
  }, [percent]);

  const colors = {
    gold: 'bg-[#C9A84C]',
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-xs text-[#6A5A40] mb-1">
          <span>Progress</span>
          <span>{percent}%</span>
        </div>
      )}
      <div className="w-full bg-[#E8E2D6] rounded-full h-2 overflow-hidden">
        <div
          className={cn('h-full rounded-full', colors[color])}
          style={{
            width: `${displayed}%`,
            transition: 'width 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
