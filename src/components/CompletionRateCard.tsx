interface CompletionRateCardProps {
  completionRate: number
  totalDays: number
  completedDays: number
}

export function CompletionRateCard({
  completionRate,
  totalDays,
  completedDays,
}: CompletionRateCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Rate</h3>
      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-green-600">
          {completionRate.toFixed(0)}%
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {completedDays} of {totalDays} days completed
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-green-600 h-3 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(completionRate, 100)}%` }}
        ></div>
      </div>
    </div>
  )
}
