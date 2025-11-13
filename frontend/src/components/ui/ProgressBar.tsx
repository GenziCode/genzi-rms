interface ProgressBarProps {
  value: number;
  label?: string;
  showLabel?: boolean;
  colorClassName?: string;
}

export default function ProgressBar({
  value,
  label,
  showLabel = true,
  colorClassName = 'bg-blue-600',
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{label}</span>
          <span className="font-medium text-gray-700">{clamped}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full ${colorClassName} transition-all duration-300 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}


