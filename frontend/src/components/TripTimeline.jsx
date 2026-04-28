import React from 'react'

function TripTimeline({ logs, tripPlan }) {
  if (!logs || logs.length === 0) return null

  const getActivitiesForDay = (logSheet) => {
    const activities = []
    let prevStatus = null

    logSheet.forEach((slot) => {
      const status = slot.status
      let timeRange = ''
      if (slot.start && slot.end) {
        timeRange = slot.start + ' - ' + slot.end
      } else if (slot.time) {
        timeRange = slot.time
      }

      if (status !== prevStatus) {
        activities.push({
          status: status,
          timeRange: timeRange,
          duration: calculateDuration(slot)
        })
        prevStatus = status
      } else if (activities.length > 0) {
        const last = activities[activities.length - 1]
        const endTime = timeRange.split(' - ')[1]
        const startTime = last.timeRange.split(' - ')[0]
        last.timeRange = startTime + ' - ' + endTime
        last.duration += calculateDuration(slot)
      }
    })

    return activities
  }

  const calculateDuration = (slot) => {
    const parseTime = (timeStr) => {
      const parts = timeStr.split(':').map(Number)
      return parts[0] + parts[1] / 60
    }

    let start, end
    if (slot.start && slot.end) {
      start = parseTime(slot.start)
      end = parseTime(slot.end)
    } else if (slot.time) {
      const parts = slot.time.split('-')
      start = parseTime(parts[0])
      end = parseTime(parts[1])
    }
    return end - start
  }

  const getActivityIcon = (status) => {
    switch (status) {
      case 'Driving':
        return '🚛'
      case 'Sleeper Berth':
        return '🛏️'
      case 'Off Duty':
        return '🏠'
      case 'On Duty (Not Driving)':
        return '⚡'
      default:
        return '•'
    }
  }

  const getActivityColor = (status) => {
    switch (status) {
      case 'Driving':
        return 'border-blue-500 bg-blue-50'
      case 'Sleeper Berth':
        return 'border-green-500 bg-green-50'
      case 'Off Duty':
        return 'border-gray-500 bg-gray-50'
      case 'On Duty (Not Driving)':
        return 'border-yellow-500 bg-yellow-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  const formatDuration = (hours) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (h > 0 && m > 0) return h + 'h ' + m + 'm'
    if (h > 0) return h + 'h'
    return m + 'm'
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Trip Timeline</h3>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-indigo-300" />

        {logs.map((dayLog) => {
          const dayNumber = dayLog.day
          const logData = dayLog.log || dayLog.log_sheet || dayLog
          const activities = getActivitiesForDay(logData)
          const dayPlan = tripPlan && tripPlan.days
            ? tripPlan.days.find(d => d.day === dayNumber)
            : null

          return (
            <div key={dayNumber} className="relative mb-6 last:mb-0">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm z-10">
                  D{dayNumber}
                </div>

                <div className="flex-1 bg-white border-2 border-indigo-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-indigo-600">Day {dayNumber}</h4>
                    <div className="flex gap-3 text-xs text-gray-600">
                      {dayPlan && dayPlan.driving_hours > 0 && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          🚛 {dayPlan.driving_hours}h
                        </span>
                      )}
                      {dayPlan && dayPlan.rest_hours > 0 && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                          🛏️ {dayPlan.rest_hours}h
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {activities.map((activity, idx) => (
                      <React.Fragment key={idx}>
                        <div
                          className={"flex items-center gap-2 px-3 py-2 rounded-lg border-2 " + getActivityColor(activity.status) + " transition hover:shadow-md"}
                          title={activity.timeRange + " (" + formatDuration(activity.duration) + ")"}
                        >
                          <span className="text-lg">{getActivityIcon(activity.status)}</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-700">
                              {activity.status === 'On Duty (Not Driving)' ? 'On Duty' : activity.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDuration(activity.duration)}
                            </span>
                          </div>
                        </div>
                        {idx < activities.length - 1 && (
                          <span className="text-gray-400">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {dayPlan && dayPlan.fuel_stop && (
                    <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                      <span>⛽</span>
                      <span>Fuel stop on this day</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TripTimeline
