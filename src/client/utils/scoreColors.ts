export function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
  ring: string;
  category: 'Good' | 'Needs Improvement' | 'Poor';
} {
  if (score >= 90) {
    return {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      ring: 'stroke-emerald-500',
      category: 'Good'
    };
  }
  if (score >= 50) {
    return {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      ring: 'stroke-amber-500',
      category: 'Needs Improvement'
    };
  }
  return {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    ring: 'stroke-rose-500',
    category: 'Poor'
  };
}

export function getConfidenceBadgeColor(level: string): string {
  switch (level?.toLowerCase()) {
    case 'high':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'low':
      return 'bg-slate-100 text-slate-800 border-slate-300';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300';
  }
}
