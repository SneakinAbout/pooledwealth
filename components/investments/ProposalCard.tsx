'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import {
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export interface ProposalTally {
  totalInvestorUnits: number;
  votedUnits: number;
  forUnits: number;
  againstUnits: number;
  participationPercent: number;
  forPercent: number;
  againstPercent: number;
  meetsParticipation: boolean;
  meetsThreshold: boolean;
  passed: boolean;
  earlyCloseReached: boolean;
}

export interface ProposalData {
  id: string;
  type: 'EXIT' | 'RESERVE_PRICE' | 'STORAGE_INSURANCE' | 'DISPUTE';
  status: 'DRAFT' | 'OPEN' | 'PASSED' | 'FAILED' | 'INVALID' | 'IMPLEMENTED';
  description: string;
  proposedValue?: string | null;
  adminRejectionReason?: string | null;
  earlyCloseTriggered: boolean;
  createdAt: string;
  closesAt?: string | null;
  implementedAt?: string | null;
  raisedBy: { id: string; name: string };
  _count: { votes: number };
  votes?: { choice: 'FOR' | 'AGAINST'; votedAt: string }[]; // current user's vote
  tally?: ProposalTally;
}

const TYPE_LABELS: Record<ProposalData['type'], string> = {
  EXIT: 'Exit Proposal',
  RESERVE_PRICE: 'Reserve Price',
  STORAGE_INSURANCE: 'Storage & Insurance',
  DISPUTE: 'Dispute',
};

const TYPE_COLORS: Record<ProposalData['type'], string> = {
  EXIT: 'bg-red-50 text-red-700 border-red-200',
  RESERVE_PRICE: 'bg-blue-50 text-blue-700 border-blue-200',
  STORAGE_INSURANCE: 'bg-purple-50 text-purple-700 border-purple-200',
  DISPUTE: 'bg-orange-50 text-orange-700 border-orange-200',
};

const STATUS_CONFIG: Record<ProposalData['status'], { label: string; icon: React.ElementType; color: string }> = {
  DRAFT: { label: 'Draft', icon: Clock, color: 'text-[#8A7A60]' },
  OPEN: { label: 'Open', icon: Clock, color: 'text-[#2E7D32]' },
  PASSED: { label: 'Passed', icon: CheckCircle2, color: 'text-[#2E7D32]' },
  FAILED: { label: 'Failed', icon: XCircle, color: 'text-red-600' },
  INVALID: { label: 'Invalid', icon: AlertTriangle, color: 'text-[#8A7A60]' },
  IMPLEMENTED: { label: 'Implemented', icon: Sparkles, color: 'text-[#C9A84C]' },
};

interface Props {
  proposal: ProposalData;
  investmentId: string;
  isAdmin?: boolean;
  onUpdated: () => void;
}

export default function ProposalCard({ proposal, investmentId, isAdmin, onUpdated }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [voting, setVoting] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const statusConfig = STATUS_CONFIG[proposal.status];
  const StatusIcon = statusConfig.icon;
  const myVote = proposal.votes?.[0] ?? null;
  const tally = proposal.tally;

  async function castVote(choice: 'FOR' | 'AGAINST') {
    setVoting(true);
    try {
      const res = await fetch(`/api/investments/${investmentId}/proposals/${proposal.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? 'Failed to cast vote');
      } else {
        toast.success('Vote recorded');
        onUpdated();
      }
    } finally {
      setVoting(false);
    }
  }

  async function moderateProposal(action: 'open' | 'reject' | 'implement', reason?: string) {
    setModerating(true);
    try {
      const res = await fetch(`/api/admin/investments/${investmentId}/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? 'Action failed');
      } else {
        toast.success(action === 'open' ? 'Proposal opened for voting' : action === 'reject' ? 'Proposal rejected' : 'Marked as implemented');
        setShowRejectForm(false);
        onUpdated();
      }
    } finally {
      setModerating(false);
    }
  }

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wide ${TYPE_COLORS[proposal.type]}`}>
              {TYPE_LABELS[proposal.type]}
            </span>
            <span className={`flex items-center gap-1 text-xs font-medium ${statusConfig.color}`}>
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
              {proposal.earlyCloseTriggered && ' (early close)'}
            </span>
          </div>
          <p className="text-sm text-[#1A1207] font-medium line-clamp-2">{proposal.description}</p>
          {proposal.proposedValue && (
            <p className="text-xs text-[#6A5A40] mt-1">Proposed: {proposal.proposedValue}</p>
          )}
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-shrink-0 text-[#8A7A60] hover:text-[#1A1207] transition-colors mt-0.5"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Tally bar (always visible for OPEN/resolved) */}
      {(proposal.status === 'OPEN' || proposal.status === 'PASSED' || proposal.status === 'FAILED') && tally && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-2 rounded-full bg-[#EDE6D6] overflow-hidden">
              <div
                className="h-full bg-[#2E7D32] rounded-full transition-all duration-500"
                style={{ width: `${tally.forPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-[#6A5A40] tabular-nums w-16 text-right">
              {tally.forPercent.toFixed(0)}% for
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#8A7A60]">
            <span>{tally.participationPercent.toFixed(0)}% participation</span>
            <span>{proposal._count.votes} votes</span>
          </div>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#E8E2D6] p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#8A7A60] mb-0.5">Raised by</p>
              <p className="text-[#1A1207] font-medium">{proposal.raisedBy.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#8A7A60] mb-0.5">Created</p>
              <p className="text-[#1A1207]">{formatDate(proposal.createdAt)}</p>
            </div>
            {proposal.closesAt && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#8A7A60] mb-0.5">
                  {proposal.status === 'OPEN' ? 'Closes' : 'Closed'}
                </p>
                <p className="text-[#1A1207]">{formatDate(proposal.closesAt)}</p>
              </div>
            )}
            {proposal.implementedAt && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#8A7A60] mb-0.5">Implemented</p>
                <p className="text-[#1A1207]">{formatDate(proposal.implementedAt)}</p>
              </div>
            )}
          </div>

          {/* Rejection reason */}
          {proposal.adminRejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
              <p className="font-medium mb-0.5">Rejection reason</p>
              <p>{proposal.adminRejectionReason}</p>
            </div>
          )}

          {/* Tally detail */}
          {tally && (
            <div className="bg-[#F7F4EE] rounded-xl p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6A5A40]">For</span>
                <span className="font-medium text-[#1A1207]">{tally.forUnits.toLocaleString()} units ({tally.forPercent.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A5A40]">Against</span>
                <span className="font-medium text-[#1A1207]">{tally.againstUnits.toLocaleString()} units ({tally.againstPercent.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between border-t border-[#E8E2D6] pt-1 mt-1">
                <span className="text-[#6A5A40]">Total co-owner units</span>
                <span className="font-medium text-[#1A1207]">{tally.totalInvestorUnits.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Vote actions — investors only, OPEN proposals */}
          {!isAdmin && proposal.status === 'OPEN' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={myVote?.choice === 'FOR' ? 'primary' : 'outline'}
                onClick={() => castVote('FOR')}
                disabled={voting}
                className="flex-1 flex items-center justify-center gap-1.5"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {myVote?.choice === 'FOR' ? 'Voted For' : 'For'}
              </Button>
              <Button
                size="sm"
                variant={myVote?.choice === 'AGAINST' ? 'danger' : 'outline'}
                onClick={() => castVote('AGAINST')}
                disabled={voting}
                className="flex-1 flex items-center justify-center gap-1.5"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                {myVote?.choice === 'AGAINST' ? 'Voted Against' : 'Against'}
              </Button>
            </div>
          )}

          {myVote && proposal.status === 'OPEN' && (
            <p className="text-[10px] text-center text-[#8A7A60]">You can change your vote before the proposal closes.</p>
          )}

          {/* Admin moderation */}
          {isAdmin && proposal.status === 'DRAFT' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => moderateProposal('open')}
                disabled={moderating}
                className="flex-1"
              >
                Open for Voting
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectForm((s) => !s)}
                disabled={moderating}
                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
              >
                Reject
              </Button>
            </div>
          )}

          {isAdmin && showRejectForm && (
            <div className="space-y-2">
              <textarea
                className="w-full text-sm border border-[#C8BEA8] rounded-xl p-2.5 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
                rows={3}
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => moderateProposal('reject', rejectReason)}
                disabled={moderating || rejectReason.trim().length < 5}
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                Confirm Rejection
              </Button>
            </div>
          )}

          {isAdmin && proposal.status === 'PASSED' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => moderateProposal('implement')}
              disabled={moderating}
              className="w-full"
            >
              Mark as Implemented
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
