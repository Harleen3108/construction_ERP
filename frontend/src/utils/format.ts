/**
 * Indian-style currency: 50,00,000 (50 lakh), 5,00,00,000 (5 crore)
 */
export const formatINR = (amount: number | undefined | null, opts?: { compact?: boolean }) => {
  if (amount == null || isNaN(Number(amount))) return '₹0';
  const n = Number(amount);
  if (opts?.compact) {
    if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  }
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const formatDate = (d?: string | Date | null) => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (d?: string | Date | null) => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const statusColor = (status: string): string => {
  const s = status?.toUpperCase() || '';
  if (s.includes('APPROVED') || s === 'COMPLETED' || s === 'PAID' || s === 'RELEASED') return 'pill-approved';
  if (s.includes('REJECTED') || s === 'CANCELLED' || s === 'FAILED') return 'pill-rejected';
  if (s.includes('PENDING') || s === 'SUBMITTED' || s === 'UNDER_APPROVAL') return 'pill-pending';
  if (s === 'IN_PROGRESS' || s === 'BIDDING_OPEN') return 'pill-progress';
  return 'pill-info';
};

export const humanStatus = (s: string) =>
  (s || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export const roleLabel = (role: string): string => {
  const map: Record<string, string> = {
    JE: 'Junior Engineer',
    SDO: 'Sub-Divisional Officer',
    EE: 'Executive Engineer',
    CE: 'Chief Engineer',
    TENDER_OFFICER: 'Tender Officer',
    CONTRACTOR: 'Contractor',
    ACCOUNTANT: 'Accountant',
    TREASURY: 'Treasury',
    ADMIN: 'System Admin',
  };
  return map[role] || role;
};
