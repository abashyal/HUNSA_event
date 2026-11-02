import React from 'react'
import type { Segment } from '../../types/event'

interface Props {
  segment: Segment
  label?: string
}

const typeColors: Record<string, string> = {
  performance: 'bg-purple-600 text-white',
  speech: 'bg-blue-600 text-white',
  break: 'bg-gray-500 text-white',
  announcement: 'bg-amber-500 text-white',
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-200 text-gray-700',
  ready: 'bg-blue-100 text-blue-700',
  performing: 'bg-green-100 text-green-700',
  done: 'bg-gray-100 text-gray-500',
  skipped: 'bg-yellow-100 text-yellow-700',
}

export default function PerformanceCard({ segment, label }: Props) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 shadow">
      {label && (
        <div className="mb-2 text-xs font-bold tracking-widest uppercase text-indigo-400">
          {label}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate">{segment.title}</h3>
          {segment.groupName && (
            <p className="text-sm text-gray-400 mt-0.5 truncate">{segment.groupName}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
              typeColors[segment.type] || 'bg-gray-600 text-white'
            }`}
          >
            {segment.type}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
              statusColors[segment.status] || 'bg-gray-200 text-gray-700'
            }`}
          >
            {segment.status}
          </span>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">{segment.duration} min</div>
    </div>
  )
}
