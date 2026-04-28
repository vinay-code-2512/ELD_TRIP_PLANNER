import React from 'react'
import LogSheet from './LogSheet'

function LogSheets({ logs, tripPlan, validationErrors }) {
  if (!logs || logs.length === 0) return null

  // Parse validation errors to find problematic days
  const problematicDays = new Set()
  if (validationErrors && validationErrors.length > 0) {
    validationErrors.forEach(err => {
      const match = err.match(/Day (\d+):/)
      if (match) {
        problematicDays.add(parseInt(match[1]))
      }
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {logs.map((dayLog) => {
        const dayNumber = dayLog.day
        const logData = dayLog.log || dayLog.log_sheet || dayLog
        const dayPlan = tripPlan?.days?.find(d => d.day === dayNumber)
        const hasError = problematicDays.has(dayNumber)

        return (
          <div
            key={dayNumber}
            className={`rounded-xl p-4 sm:p-6 shadow-sm ${
              hasError
                ? 'bg-red-50 border-l-4 border-red-500'
                : 'bg-gray-50 border-l-4 border-indigo-500'
            }`}
          >
            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
              hasError ? 'text-red-600' : 'text-indigo-600'
            }`}>
              Day {dayNumber}
              {hasError && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  ⚠️ Warning
                </span>
              )}
            </h3>

            {dayPlan && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Driving</p>
                  <p className={`text-lg font-bold ${dayPlan.driving_hours > 11 ? 'text-red-600' : 'text-gray-800'}`}>
                    {dayPlan.driving_hours || 0}h
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Break</p>
                  <p className="text-lg font-bold text-gray-800">
                    {dayPlan.break_taken || dayPlan.break ? '30m' : 'None'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Rest</p>
                  <p className={`text-lg font-bold ${dayPlan.rest_hours > 0 ? 'text-gray-800' : 'text-yellow-600'}`}>
                    {dayPlan.rest_hours || 0}h
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Cycle Used</p>
                  <p className="text-lg font-bold text-orange-500">
                    {dayPlan.cycle_used_after_day || 0}h
                  </p>
                </div>
              </div>
            )}

            <LogSheet logSheet={logData} />
          </div>
        )
      })}
    </div>
  )
}

export default LogSheets
