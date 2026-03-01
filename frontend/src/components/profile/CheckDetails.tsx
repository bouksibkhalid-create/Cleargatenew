import { formatCheckDate } from '../../utils/formatters';

interface CheckDetailsProps {
  entityType: string;
  country: string | null;
  createdAt: string;
  status: string;
  sourcesFailed: string[];
}

export default function CheckDetails({
  entityType,
  country,
  createdAt,
  status,
  sourcesFailed,
}: CheckDetailsProps) {
  const statusColor =
    status.toLowerCase() === 'completed'
      ? 'text-green-600'
      : status.toLowerCase() === 'partial'
      ? 'text-amber-600'
      : 'text-red-600';

  const fields = [
    { label: 'Type', value: entityType.charAt(0).toUpperCase() + entityType.slice(1) },
    { label: 'Country', value: country || '—' },
    { label: 'Created', value: formatCheckDate(createdAt) },
    { label: 'Status', value: status.charAt(0).toUpperCase() + status.slice(1), color: statusColor },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">
        Check Details
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {fields.map((field) => (
          <div key={field.label}>
            <p className="text-xs text-gray-400 mb-1">{field.label}</p>
            <p className={`text-sm font-medium ${field.color || 'text-gray-900'}`}>
              {field.value}
            </p>
          </div>
        ))}
      </div>

      {sourcesFailed.length > 0 && (
        <p className="text-xs text-amber-600 mt-2">
          Note: Some sources were unavailable ({sourcesFailed.join(', ')})
        </p>
      )}
    </div>
  );
}
