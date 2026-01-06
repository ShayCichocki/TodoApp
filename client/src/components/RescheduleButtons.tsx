import { useState } from 'react';
import { addDaysToDate } from '../lib/dateUtils';

interface RescheduleButtonsProps {
  todoId: number;
  currentDueDate: string;
  onReschedule: (todoId: number, newDueDate: string) => void;
  isComplete: boolean;
}

export const RescheduleButtons: React.FC<RescheduleButtonsProps> = ({
  todoId,
  currentDueDate,
  onReschedule,
  isComplete,
}) => {
  const [loadingButton, setLoadingButton] = useState<number | null>(null);

  if (isComplete) {
    return null;
  }

  const handleReschedule = (days: number): void => {
    setLoadingButton(days);
    const newDueDate = addDaysToDate(currentDueDate, days);
    onReschedule(todoId, newDueDate);
    setTimeout(() => setLoadingButton(null), 1000);
  };

  const buttonClass = (days: number): string => {
    const baseClass =
      'rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50';
    const isLoading = loadingButton === days;
    if (isLoading) {
      return `${baseClass} bg-moss-600 text-white cursor-wait`;
    }
    return `${baseClass} bg-moss-500 text-white hover:bg-moss-600`;
  };

  return (
    <div className="flex gap-1">
      <button
        onClick={() => handleReschedule(1)}
        disabled={loadingButton !== null}
        className={buttonClass(1)}
        aria-label="Reschedule for tomorrow"
      >
        {loadingButton === 1 ? '...' : '+1 Day'}
      </button>
      <button
        onClick={() => handleReschedule(3)}
        disabled={loadingButton !== null}
        className={buttonClass(3)}
        aria-label="Reschedule for 3 days later"
      >
        {loadingButton === 3 ? '...' : '+3 Days'}
      </button>
      <button
        onClick={() => handleReschedule(7)}
        disabled={loadingButton !== null}
        className={buttonClass(7)}
        aria-label="Reschedule for 1 week later"
      >
        {loadingButton === 7 ? '...' : '+1 Week'}
      </button>
    </div>
  );
};
