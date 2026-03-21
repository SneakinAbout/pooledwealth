'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FeaturedToggle({ investmentId, initialFeatured }: { investmentId: string; initialFeatured: boolean }) {
  const [featured, setFeatured] = useState(initialFeatured);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/investments/${investmentId}/feature`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeatured(data.featuredOnHome);
      toast.success(data.featuredOnHome ? 'Featured on home page' : 'Removed from home page');
    } catch {
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={featured ? 'Remove from home page' : 'Feature on home page'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        featured
          ? 'bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#8A6A00]'
          : 'bg-white border-[#E8E2D6] text-[#8A7A60] hover:border-[#C9A84C]/40'
      }`}
    >
      <Star className={`h-3.5 w-3.5 ${featured ? 'fill-[#C9A84C] text-[#C9A84C]' : ''}`} />
      {featured ? 'Featured' : 'Feature'}
    </button>
  );
}
