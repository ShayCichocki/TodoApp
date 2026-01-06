export const CHART_COLORS = {
  forest: ['#4a7c4a', '#3a6239', '#2f4e2f', '#263e26', '#1d301d'],
  moss: ['#6d8a47', '#566e38', '#43552d', '#374527', '#2f3a22'],
  sage: ['#768864', '#5d6b4f', '#4a5540', '#3d4636', '#343c2f'],
  priority: {
    URGENT: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#6d8a47',
    LOW: '#4a7c4a',
  },
  status: {
    complete: '#4a7c4a',
    onTime: '#4a7c4a',
    late: '#ea580c',
    overdue: '#dc2626',
  },
};

export const getColorForIndex = (index: number, palette: 'forest' | 'moss' | 'sage' = 'forest'): string => {
  const colors = CHART_COLORS[palette];
  return colors[index % colors.length] ?? colors[0] ?? '#4a7c4a';
};
