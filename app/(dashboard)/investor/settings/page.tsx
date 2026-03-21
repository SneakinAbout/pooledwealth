'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, MapPin, Shield, Phone, Calendar, ChevronDown, Landmark, Lock, Briefcase } from 'lucide-react';
import MyDocuments from '@/components/investor/MyDocuments';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import KycUpload from '@/components/kyc/KycUpload';
import toast from 'react-hot-toast';

const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'] as const;

interface Profile {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  taxFileNumber: string; // masked from server
  hasTfn: boolean;
  kycApproved: boolean;
  bankAccountName: string;
  bankBsb: string;
  bankAccountNumber: string; // masked from server
  hasBankAccount: boolean;
  bio: string;
  linkedinUrl: string;
}

export default function InvestorSettingsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Form state per section
  const [personal, setPersonal] = useState({ name: '', phone: '', dateOfBirth: '' });
  const [address, setAddress] = useState({ streetAddress: '', suburb: '', state: '', postcode: '' });
  const [tfn, setTfn] = useState('');
  const [tfnDirty, setTfnDirty] = useState(false);
  const [bank, setBank] = useState({ bankAccountName: '', bankBsb: '', bankAccountNumber: '' });
  const [bankDirty, setBankDirty] = useState(false);
  const [bio, setBio] = useState('');
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    fetch('/api/investor/profile')
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setPersonal({
          name: data.name ?? '',
          phone: data.phone ?? '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '',
        });
        setAddress({
          streetAddress: data.streetAddress ?? '',
          suburb: data.suburb ?? '',
          state: data.state ?? '',
          postcode: data.postcode ?? '',
        });
        setBio(data.bio ?? '');
        setLoading(false);
        setBankDirty(false);
      });
  }, []);

  async function save(section: string, data: Record<string, string | null>) {
    setSaving(section);
    // Convert empty strings to null so optional Zod fields don't fail
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? null : v])
    );
    try {
      const res = await fetch('/api/investor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error?.formErrors?.[0] ?? 'Failed to save');
        return;
      }
      toast.success('Saved');
      if (section === 'tfn') {
        setTfnDirty(false);
        setTfn('');
        const updated = await fetch('/api/investor/profile').then((r) => r.json());
        setProfile(updated);
      }
      if (section === 'bank') {
        setBankDirty(false);
        setBank({ bankAccountName: '', bankBsb: '', bankAccountNumber: '' });
        const updated = await fetch('/api/investor/profile').then((r) => r.json());
        setProfile(updated);
      }
    } finally {
      setSaving(null);
    }
  }

  async function savePassword() {
    if (pw.newPassword !== pw.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving('password');
    try {
      const res = await fetch('/api/investor/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error?.formErrors?.[0] ?? d.error ?? 'Failed'); return; }
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-[#EDE6D6] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1207]">Account Settings</h1>
        <p className="text-sm text-[#8A7A60] mt-0.5">Manage your personal information and tax details</p>
      </div>

      {/* KYC status banner */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
        profile.kycApproved
          ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32]'
          : 'bg-[#FFF8E1] border-[#FFECB3] text-[#F57F17]'
      }`}>
        <Shield className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">
            {profile.kycApproved ? 'Identity Verified' : 'Identity Verification Pending'}
          </p>
          <p className="text-xs mt-0.5">
            {profile.kycApproved
              ? 'Your identity has been verified. You can invest on the platform.'
              : 'Your KYC application is under review. You\'ll be able to invest once approved.'}
          </p>
        </div>
      </div>

      {/* KYC Document Upload */}
      {!profile.kycApproved && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-[#1A2B1F] flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-[#C9A84C]" />
            </div>
            <h2 className="text-sm font-bold text-[#1A1207]">Identity Documents</h2>
          </div>
          <KycUpload />
        </Card>
      )}

      {/* Personal Details */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="h-7 w-7 rounded-lg bg-[#1A2B1F] flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-[#C9A84C]" />
          </div>
          <h2 className="text-sm font-bold text-[#1A1207]">Personal Details</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
              Full Name
            </label>
            <Input
              value={personal.name}
              onChange={(e) => setPersonal((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your full legal name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</span>
              </label>
              <Input
                type="tel"
                value={personal.phone}
                onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. 0412 345 678"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Date of Birth</span>
              </label>
              <Input
                type="date"
                value={personal.dateOfBirth}
                onChange={(e) => setPersonal((p) => ({ ...p, dateOfBirth: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <Input value={profile.email ?? ''} disabled className="opacity-60 cursor-not-allowed" />
            <p className="text-[10px] text-[#8A7A60] mt-1">Email cannot be changed. Contact support if needed.</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            size="sm"
            onClick={() => save('personal', personal)}
            disabled={saving === 'personal'}
            loading={saving === 'personal'}
          >
            Save Personal Details
          </Button>
        </div>
      </Card>

      {/* Address */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="h-7 w-7 rounded-lg bg-[#1A2B1F] flex items-center justify-center">
            <MapPin className="h-3.5 w-3.5 text-[#C9A84C]" />
          </div>
          <h2 className="text-sm font-bold text-[#1A1207]">Residential Address</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
              Street Address
            </label>
            <Input
              value={address.streetAddress}
              onChange={(e) => setAddress((a) => ({ ...a, streetAddress: e.target.value }))}
              placeholder="e.g. 42 Collins Street"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
                Suburb
              </label>
              <Input
                value={address.suburb}
                onChange={(e) => setAddress((a) => ({ ...a, suburb: e.target.value }))}
                placeholder="e.g. Melbourne"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
                State / Territory
              </label>
              <div className="relative">
                <select
                  value={address.state}
                  onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                  className="w-full text-sm border border-[#C8BEA8] rounded-xl px-3 py-2.5 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 text-[#1A1207] pr-8"
                >
                  <option value="">Select</option>
                  {AU_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A7A60] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
                Postcode
              </label>
              <Input
                value={address.postcode}
                onChange={(e) => setAddress((a) => ({ ...a, postcode: e.target.value }))}
                placeholder="e.g. 3000"
                maxLength={4}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            size="sm"
            onClick={() => save('address', address)}
            disabled={saving === 'address'}
            loading={saving === 'address'}
          >
            Save Address
          </Button>
        </div>
      </Card>

      {/* Bank Account */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-lg bg-[#1A2B1F] flex items-center justify-center">
            <Landmark className="h-3.5 w-3.5 text-[#C9A84C]" />
          </div>
          <h2 className="text-sm font-bold text-[#1A1207]">Bank Account</h2>
        </div>
        <p className="text-xs text-[#8A7A60] mb-5">
          Used to process withdrawal requests. Your BSB and account number are stored securely.
        </p>

        {profile.hasBankAccount && !bankDirty ? (
          <div className="space-y-3">
            <div className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-4 space-y-1.5 text-sm">
              <p className="font-medium text-[#1A1207]">{profile.bankAccountName}</p>
              <p className="text-[#6A5A40]">BSB: {profile.bankBsb}</p>
              <p className="text-[#6A5A40]">Account: {profile.bankAccountNumber}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setBankDirty(true)}>Update Bank Details</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">Account Name</label>
              <Input
                value={bank.bankAccountName}
                onChange={(e) => setBank((b) => ({ ...b, bankAccountName: e.target.value }))}
                placeholder="e.g. John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">BSB</label>
                <Input
                  value={bank.bankBsb}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3);
                    setBank((b) => ({ ...b, bankBsb: val }));
                  }}
                  placeholder="e.g. 062-000"
                  maxLength={7}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">Account Number</label>
                <Input
                  value={bank.bankAccountNumber}
                  onChange={(e) => setBank((b) => ({ ...b, bankAccountNumber: e.target.value }))}
                  placeholder="e.g. 12345678"
                  maxLength={20}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {profile.hasBankAccount && (
                <Button size="sm" variant="ghost" onClick={() => { setBankDirty(false); setBank({ bankAccountName: '', bankBsb: '', bankAccountNumber: '' }); }}>
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => save('bank', bank)}
                disabled={saving === 'bank' || !bank.bankAccountName || !bank.bankBsb || !bank.bankAccountNumber}
                loading={saving === 'bank'}
              >
                Save Bank Details
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Tax Details */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-lg bg-[#1A2B1F] flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-[#C9A84C]" />
          </div>
          <h2 className="text-sm font-bold text-[#1A1207]">Tax Information</h2>
        </div>
        <p className="text-xs text-[#8A7A60] mb-5">
          Your Tax File Number (TFN) is required for investment income reporting under Australian tax law.
          It is stored securely and never shared with third parties.
        </p>

        <div>
          <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
            Tax File Number (TFN)
          </label>

          {profile.hasTfn && !tfnDirty ? (
            <div className="flex items-center gap-3">
              <Input value={profile.taxFileNumber ?? '••• ••• •••'} disabled className="opacity-60 cursor-not-allowed font-mono-val tracking-widest" />
              <Button size="sm" variant="ghost" onClick={() => setTfnDirty(true)}>
                Update
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="text"
                value={tfn}
                onChange={(e) => setTfn(e.target.value)}
                placeholder="e.g. 123 456 789"
                maxLength={11}
                className="font-mono-val tracking-widest"
              />
              <p className="text-[10px] text-[#8A7A60]">
                Enter your 9-digit TFN. You can find this on your ATO correspondence, payment summary, or myGov account.
              </p>
              <div className="flex gap-2">
                {profile.hasTfn && (
                  <Button size="sm" variant="ghost" onClick={() => { setTfnDirty(false); setTfn(''); }}>
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => save('tfn', { taxFileNumber: tfn || null })}
                  disabled={saving === 'tfn' || (!tfn && !profile.hasTfn)}
                  loading={saving === 'tfn'}
                >
                  Save TFN
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-[#FFF8E1] border border-[#FFECB3] rounded-xl">
          <p className="text-xs text-[#7B5800]">
            <span className="font-semibold">Withholding tax:</span> If you don&apos;t provide your TFN, we are required by the ATO to withhold tax at the top marginal rate (47%) on your investment distributions.
          </p>
        </div>
      </Card>

      {/* Manager profile — only shown to MANAGER and ADMIN */}
      {(role === 'MANAGER' || role === 'ADMIN') && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="h-7 w-7 rounded-lg bg-[#1A2B1F] flex items-center justify-center">
              <Briefcase className="h-3.5 w-3.5 text-[#C9A84C]" />
            </div>
            <h2 className="text-sm font-bold text-[#1A1207]">Manager Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Tell investors about your background and expertise..."
                className="w-full text-sm border border-[#C8BEA8] rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 text-[#1A1207] resize-none"
              />
              <p className="text-[10px] text-[#8A7A60] mt-1">{bio.length}/1000</p>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button size="sm" onClick={() => save('bio', { bio })} disabled={saving === 'bio'} loading={saving === 'bio'}>
              Save Profile
            </Button>
          </div>
        </Card>
      )}

      {/* Change Password */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="h-7 w-7 rounded-lg bg-[#1A2B1F] flex items-center justify-center">
            <Lock className="h-3.5 w-3.5 text-[#C9A84C]" />
          </div>
          <h2 className="text-sm font-bold text-[#1A1207]">Change Password</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">Current Password</label>
            <Input type="password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">New Password</label>
              <Input type="password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">Confirm New Password</label>
              <Input type="password" value={pw.confirmPassword} onChange={(e) => setPw((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button size="sm" onClick={savePassword} disabled={saving === 'password' || !pw.currentPassword || !pw.newPassword} loading={saving === 'password'}>
            Change Password
          </Button>
        </div>
      </Card>

      <MyDocuments />
    </div>
  );
}
