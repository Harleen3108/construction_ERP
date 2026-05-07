import { humanStatus, statusColor } from '../../utils/format';

export default function StatusPill({ status }: { status: string }) {
  return (
    <span className={`pill ${statusColor(status)}`}>
      {humanStatus(status || '—')}
    </span>
  );
}
