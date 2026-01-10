import React from 'react';

type Status = 'draft' | 'in_editing' | 'in_review' | 'approved' | 'launched' | 'analyzing' | 'completed';

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; color: string }> = {
  draft: { label: 'Bozza', color: 'bg-gray-600 text-gray-100' },
  in_editing: { label: 'In Editing', color: 'bg-yellow-600 text-yellow-100' },
  in_review: { label: 'In Review', color: 'bg-blue-600 text-blue-100' },
  approved: { label: 'Approvata', color: 'bg-green-600 text-green-100' },
  launched: { label: 'Lanciata', color: 'bg-purple-600 text-purple-100' },
  analyzing: { label: 'In Analisi', color: 'bg-orange-600 text-orange-100' },
  completed: { label: 'Completata', color: 'bg-gray-700 text-gray-300' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
