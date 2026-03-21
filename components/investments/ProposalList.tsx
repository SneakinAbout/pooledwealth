'use client';

import { useState, useEffect, useCallback } from 'react';
import { Vote, MessageSquare, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProposalCard, { ProposalData } from './ProposalCard';
import CreateProposalModal from './CreateProposalModal';

interface Props {
  investmentId: string;
  isAdmin: boolean;
  isOwner: boolean; // true if current user holds units
}

export default function ProposalList({ investmentId, isAdmin, isOwner }: Props) {
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchProposals = useCallback(async () => {
    try {
      const res = await fetch(`/api/investments/${investmentId}/proposals`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } finally {
      setLoading(false);
    }
  }, [investmentId]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const canRaise = isOwner || isAdmin;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#1A2B1F] flex items-center justify-center">
            <Vote className="h-3.5 w-3.5 text-[#C9A84C]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1A1207]">Co-owner Proposals</h2>
            <p className="text-[10px] text-[#8A7A60]">Weighted voting by share ownership</p>
          </div>
        </div>
        {canRaise && (
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Raise Proposal
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-[#EDE6D6] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <MessageSquare className="h-8 w-8 text-[#C8BEA8] mb-3" />
          <p className="text-sm text-[#8A7A60]">No proposals yet.</p>
          {canRaise && (
            <p className="text-xs text-[#8A7A60] mt-1">
              As a co-owner you can raise proposals for all co-owners to vote on.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              investmentId={investmentId}
              isAdmin={isAdmin}
              onUpdated={fetchProposals}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProposalModal
          investmentId={investmentId}
          onClose={() => setShowCreate(false)}
          onCreated={fetchProposals}
        />
      )}
    </div>
  );
}
