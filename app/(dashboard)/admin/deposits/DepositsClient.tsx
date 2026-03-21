'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface Deposit {
  id: string;
  amount: number;
  status: string;
  reference: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

function statusBadge(status: string) {
  if (status === 'COMPLETED') return <Badge variant="success">Approved</Badge>;
  if (status === 'FAILED') return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

export default function DepositsClient({ deposits: initial }: { deposits: Deposit[] }) {
  const router = useRouter();
  const [deposits, setDeposits] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setLoading(`${id}:${action}`);
    try {
      const res = await fetch(`/api/admin/deposits/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeposits((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: action === 'approve' ? 'COMPLETED' : 'FAILED' } : d
        )
      );
      toast.success(action === 'approve' ? 'Deposit approved and wallet credited' : 'Deposit rejected');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E2D6] text-left">
              <th className="pb-3 text-[#6A5A40] font-medium">User</th>
              <th className="pb-3 text-[#6A5A40] font-medium text-right">Amount</th>
              <th className="pb-3 text-[#6A5A40] font-medium">Reference</th>
              <th className="pb-3 text-[#6A5A40] font-medium">Date</th>
              <th className="pb-3 text-[#6A5A40] font-medium text-center">Status</th>
              <th className="pb-3 text-[#6A5A40] font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D6]">
            {deposits.map((d) => (
              <tr key={d.id} className="hover:bg-[#EDE6D6]/50 transition-colors">
                <td className="py-3.5">
                  <p className="font-medium text-[#1A1207]">{d.user.name}</p>
                  <p className="text-xs text-[#6A5A40]">{d.user.email}</p>
                </td>
                <td className="py-3.5 text-right font-semibold font-mono-val">
                  {formatCurrency(d.amount)}
                </td>
                <td className="py-3.5">
                  <code className="text-xs text-[#6A5A40] bg-[#EDE6D6] px-2 py-0.5 rounded">
                    {d.reference}
                  </code>
                </td>
                <td className="py-3.5 text-[#6A5A40] text-xs">
                  {new Date(d.createdAt).toLocaleString()}
                </td>
                <td className="py-3.5 text-center">
                  {statusBadge(d.status)}
                </td>
                <td className="py-3.5 text-right">
                  {d.status === 'PENDING' ? (
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => act(d.id, 'approve')}
                        disabled={loading !== null}
                        className="text-[#2E7D32] hover:text-[#2E7D32] hover:bg-[#E8F5E9] border-[#2E7D32]/20"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        {loading === `${d.id}:approve` ? 'Approving…' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => act(d.id, 'reject')}
                        disabled={loading !== null}
                        className="text-[#C62828] hover:text-[#C62828] hover:bg-[#FFEBEE] border-[#C62828]/20"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        {loading === `${d.id}:reject` ? 'Rejecting…' : 'Reject'}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-[#8A7A60] flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" /> Resolved
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
