'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Update {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  authorName: string | null;
}

interface Props {
  investmentId: string;
  canPost: boolean; // manager or admin
}

export default function InvestmentUpdates({ investmentId, canPost }: Props) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/investments/${investmentId}/updates`)
      .then((r) => r.json())
      .then(setUpdates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [investmentId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/investments/${investmentId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post update');
      setUpdates((prev) => [data, ...prev]);
      setTitle('');
      setBody('');
      setShowForm(false);
      toast.success('Update posted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post update');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#E3F2FD] flex items-center justify-center">
            <Megaphone className="h-3.5 w-3.5 text-[#1565C0]" />
          </div>
          <h2 className="text-sm font-semibold text-[#1A1207]">
            Investment Updates
            {updates.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-[#EDE6D6] text-[#6A5A40] px-1.5 py-0.5 rounded-full">
                {updates.length}
              </span>
            )}
          </h2>
        </div>
        {canPost && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#1A2B1F] transition-colors font-medium"
          >
            <Plus className="h-3 w-3" /> Post update
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handlePost} className="mb-5 p-4 bg-[#EDE6D6] rounded-xl border border-[#E8E2D6] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#1A1207]">New Update</p>
            <button type="button" onClick={() => setShowForm(false)} className="text-[#8A7A60] hover:text-[#1A1207]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Update title…"
            required
            className="w-full bg-white border border-[#E8E2D6] rounded-lg px-3 py-2 text-sm text-[#1A1207] placeholder-[#8A7A60] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your update…"
            required
            rows={4}
            className="w-full bg-white border border-[#E8E2D6] rounded-lg px-3 py-2 text-sm text-[#1A1207] placeholder-[#8A7A60] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={submitting}>Post Update</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-[#8A7A60]">Loading…</div>
      ) : updates.length === 0 ? (
        <p className="text-sm text-[#8A7A60] py-4 text-center">No updates posted yet.</p>
      ) : (
        <div className="space-y-3">
          {updates.map((u) => (
            <div key={u.id} className="border border-[#E8E2D6] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#EDE6D6]/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-[#1A1207]">{u.title}</p>
                  <p className="text-[10px] text-[#8A7A60] mt-0.5">
                    {u.authorName} · {formatDate(u.createdAt)}
                  </p>
                </div>
                {expanded === u.id
                  ? <ChevronUp className="h-4 w-4 text-[#8A7A60] flex-shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-[#8A7A60] flex-shrink-0" />}
              </button>
              {expanded === u.id && (
                <div className="px-3.5 pb-3.5 text-sm text-[#6A5A40] whitespace-pre-wrap border-t border-[#E8E2D6] pt-3">
                  {u.body}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
