'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Props {
  investmentId: string;
  status: string;
}

export default function AdminInvestmentActions({ investmentId, status }: Props) {
  const router = useRouter();
  const [showArchive, setShowArchive] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/investments/${investmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success(`Investment ${newStatus.toLowerCase()}`);
      setShowArchive(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {status === 'DRAFT' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange('ACTIVE')}
          disabled={loading}
        >
          Activate
        </Button>
      )}
      {status === 'ACTIVE' && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleStatusChange('CLOSED')}
          disabled={loading}
        >
          Close
        </Button>
      )}
      <Button
        variant="danger"
        size="sm"
        onClick={() => setShowArchive(true)}
        disabled={loading}
      >
        Archive
      </Button>

      <ConfirmDialog
        isOpen={showArchive}
        onClose={() => setShowArchive(false)}
        onConfirm={() => handleStatusChange('ARCHIVED')}
        title="Archive Investment"
        message="This investment will be hidden from all users. This action cannot be undone."
        confirmLabel="Archive"
        loading={loading}
      />
    </>
  );
}
