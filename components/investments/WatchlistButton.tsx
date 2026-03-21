'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  investmentId: string;
  initialSaved: boolean;
}

export default function WatchlistButton({ investmentId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/investor/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investmentId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSaved(data.saved);
      toast.success(data.saved ? 'Added to watchlist' : 'Removed from watchlist');
    } catch {
      toast.error('Failed to update watchlist');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from watchlist' : 'Save to watchlist'}
      className={`absolute top-2.5 right-2.5 h-7 w-7 rounded-lg flex items-center justify-center transition-all z-10 ${
        saved
          ? 'bg-[#C9A84C] text-white shadow-sm'
          : 'bg-white/80 text-[#6A5A40] hover:bg-white hover:text-[#C9A84C] backdrop-blur-sm'
      }`}
    >
      <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-white' : ''}`} />
    </button>
  );
}
