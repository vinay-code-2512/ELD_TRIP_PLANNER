import React, { useMemo } from 'react'

const STATUS_CONFIG = {
  'Driving': { color: '#3b82f6', row: 0 },
  'Off Duty': { color: '#6b7280', row: 1 },
  'Sleeper Berth': { color: '#22c55e', row: 2 },
  'On Duty (Not Driving)': { color: '#eab308', row: 3 }
}

const ROW_HEIGHT = 40
const HEADER_HEIGHT = 30
const FOOTER_HEIGHT = 20
const LEFT_MARGIN = 120
const RIGHT_MARGIN = 20
const TOP_MARGIN = 10
const BOTTOM_MARGIN = 10

function LogSheet({ logSheet }) {
  if (!logSheet || logSheet.length === 0) return null

  const svgContent = useMemo(() => {
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours + minutes / 60
    }

    const totalHeight = HEADER_HEIGHT + TOP_MARGIN + 4 * ROW_HEIGHT + BOTTOM_MARGIN + FOOTER_HEIGHT

    const pathSegments = []
    let prevEndX = null
    let prevStatus = null

    logSheet.forEach((slot, index) => {
      let startHours, endHours

      if (slot.start && slot.end) {
        startHours = parseTime(slot.start)
        endHours = parseTime(slot.end)
      } else if (slot.time) {
        const [startStr, endStr] = slot.time.split('-')
        startHours = parseTime(startStr)
        endHours = parseTime(endStr)
      } else {
        return
      }

      const statusConfig = STATUS_CONFIG[slot.status]
      if (!statusConfig) return

      const startX = LEFT_MARGIN + (startHours / 24) * (1000 - LEFT_MARGIN - RIGHT_MARGIN)
      const endX = LEFT_MARGIN + (endHours / 24) * (1000 - LEFT_MARGIN - RIGHT_MARGIN)
      const y = HEADER_HEIGHT + TOP_MARGIN + statusConfig.row * ROW_HEIGHT + ROW_HEIGHT / 2

      if (index === 0) {
        pathSegments.push(`M ${startX} ${y}`)
      } else if (slot.status !== prevStatus) {
        pathSegments.push(`L ${prevEndX} ${y}`)
      }

      pathSegments.push(`L ${endX} ${y}`)
      prevEndX = endX
      prevStatus = slot.status
    })

    const pathD = pathSegments.join(' ')

    return { pathD, totalHeight }
  }, [logSheet])

  const { pathD, totalHeight } = svgContent

  const statusRows = Object.entries(STATUS_CONFIG)

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours + minutes / 60
  }

  return (
    <div className="mt-4 border-2 border-gray-800 rounded-lg overflow-hidden bg-white log-sheet-container">
      <svg
        viewBox={`0 0 1000 ${totalHeight}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Header with hour labels */}
        <rect x="0" y="0" width="1000" height={HEADER_HEIGHT} fill="#1f2937" />
        {Array.from({ length: 25 }, (_, i) => {
          const x = LEFT_MARGIN + (i / 24) * (1000 - LEFT_MARGIN - RIGHT_MARGIN)
          return (
            <text
              key={`hour-${i}`}
              x={x}
              y={HEADER_HEIGHT / 2 + 4}
              fill="white"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              {i}:00
            </text>
          )
        })}

        {/* Status rows */}
        {statusRows.map(([status, config]) => {
          const y = HEADER_HEIGHT + TOP_MARGIN + config.row * ROW_HEIGHT
          return (
            <g key={status}>
              <rect
                x="0"
                y={y}
                width="1000"
                height={ROW_HEIGHT}
                fill={config.row % 2 === 0 ? '#f9fafb' : '#ffffff'}
              />
              <rect
                x="0"
                y={y}
                width={LEFT_MARGIN}
                height={ROW_HEIGHT}
                fill="#f3f4f6"
                stroke="#d1d5db"
                strokeWidth="0.5"
              />
              <text
                x={LEFT_MARGIN / 2}
                y={y + ROW_HEIGHT / 2 + 4}
                fontSize="10"
                fontWeight="600"
                fill="#374151"
                textAnchor="middle"
              >
                {status}
              </text>
              <line
                x1="0"
                y1={y + ROW_HEIGHT}
                x2="1000"
                y2={y + ROW_HEIGHT}
                stroke="#d1d5db"
                strokeWidth="0.5"
              />
            </g>
          )
        })}

        {/* Vertical hour grid lines */}
        {Array.from({ length: 25 }, (_, i) => {
          const x = LEFT_MARGIN + (i / 24) * (1000 - LEFT_MARGIN - RIGHT_MARGIN)
          return (
            <line
              key={`vline-${i}`}
              x1={x}
              y1={HEADER_HEIGHT + TOP_MARGIN}
              x2={x}
              y2={HEADER_HEIGHT + TOP_MARGIN + 4 * ROW_HEIGHT}
              stroke="#d1d5db"
              strokeWidth={i % 2 === 0 ? '1' : '0.5'}
            />
          )
        })}

        {/* Continuous timeline path */}
        <path
          d={pathD}
          fill="none"
          stroke="#1f2937"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Status segments with tooltips */}
        {logSheet.map((slot, index) => {
          let startHours, endHours

          if (slot.start && slot.end) {
            startHours = parseTime(slot.start)
            endHours = parseTime(slot.end)
          } else if (slot.time) {
            const [startStr, endStr] = slot.time.split('-')
            startHours = parseTime(startStr)
            endHours = parseTime(endStr)
          } else {
            return null
          }

          const statusConfig = STATUS_CONFIG[slot.status]
          if (!statusConfig) return null

          const x = LEFT_MARGIN + (startHours / 24) * (1000 - LEFT_MARGIN - RIGHT_MARGIN)
          const width = ((endHours - startHours) / 24) * (1000 - LEFT_MARGIN - RIGHT_MARGIN)
          const y = HEADER_HEIGHT + TOP_MARGIN + statusConfig.row * ROW_HEIGHT

          const tooltipText = `${slot.start || slot.time?.split('-')[0]} - ${slot.end || slot.time?.split('-')[1]}: ${slot.status}`

          return (
            <g key={`segment-${index}`}>
              <rect
                x={x}
                y={y}
                width={width}
                height={ROW_HEIGHT}
                fill={statusConfig.color}
                opacity="0.4"
                className="hover:opacity-70 cursor-pointer"
              >
                <title>{tooltipText}</title>
              </rect>
            </g>
          )
        })}

        {/* Left border line */}
        <line
          x1={LEFT_MARGIN}
          y1={HEADER_HEIGHT + TOP_MARGIN}
          x2={LEFT_MARGIN}
          y2={HEADER_HEIGHT + TOP_MARGIN + 4 * ROW_HEIGHT}
          stroke="#1f2937"
          strokeWidth="2"
        />
      </svg>

      {/* Legend with updated colors */}
      <div className="flex gap-4 p-2 justify-center flex-wrap border-t border-gray-300">
        {statusRows.map(([status, config]) => (
          <div key={status} className="flex items-center gap-2 text-xs">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: config.color }}
            />
            <span>{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LogSheet
