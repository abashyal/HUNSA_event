import React from 'react'
import useEventStore from '../store/useEventStore'
import ConnectionBadge from '../components/shared/ConnectionBadge'

const typeColors: Record<string, string> = {
  performance: 'bg-purple-100 text-purple-800',
  speech: 'bg-blue-100 text-blue-800',
  break: 'bg-gray-100 text-gray-700',
  announcement: 'bg-amber-100 text-amber-800',
}

const statusConfig: Record<string, { label: string; className: string; lineThrough?: boolean }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-600' },
  ready: { label: 'Ready', className: 'bg-blue-100 text-blue-700' },
  performing: { label: 'Performing', className: 'bg-green-100 text-green-700 animate-pulse' },
  done: { label: 'Done', className: 'bg-gray-100 text-gray-400', lineThrough: true },
  skipped: { label: 'Skipped', className: 'bg-yellow-100 text-yellow-700' },
}

export default function CommitteeView() {
  const event = useEventStore((s) => s.event)
  const toggleReadiness = useEventStore((s) => s.toggleReadiness)

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
        Connecting...
      </div>
    )
  }

  const segments = [...event.segments].sort((a, b) => a.order - b.order)

  const canToggle = (status: string) =>
    status === 'pending' || status === 'ready'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-base font-bold text-gray-800 leading-tight">{event.eventName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge />
          <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
            COMMITTEE
          </span>
        </div>
      </header>

      {/* Emergency stop banner */}
      {event.emergencyStop && (
        <div className="bg-red-600 text-white text-center py-4 px-4 text-lg font-bold animate-pulse">
          ⚠ EMERGENCY STOP – Stand by
        </div>
      )}

      <div className="max-w-xl mx-auto px-4 py-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
          Full Program
        </h2>

        <div className="space-y-3">
          {segments.map((seg) => {
            const sc = statusConfig[seg.status] || statusConfig['pending']
            const isToggleable = canToggle(seg.status)

            return (
              <div
                key={seg.id}
                className={`bg-white border rounded-2xl p-4 shadow-sm ${
                  event.currentSegmentId === seg.id
                    ? 'border-green-400'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Order */}
                  <span className="text-gray-400 font-mono text-sm mt-0.5 w-6 flex-shrink-0">
                    {seg.order}
                  </span>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          typeColors[seg.type] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {seg.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.className}`}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <h3
                      className={`text-base font-bold text-gray-900 ${
                        sc.lineThrough ? 'line-through text-gray-400' : ''
                      }`}
                    >
                      {seg.title}
                    </h3>
                    {seg.groupName && (
                      <p className="text-sm text-gray-500 mt-0.5">{seg.groupName}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{seg.duration} min</p>
                  </div>

                  {/* Readiness toggle */}
                  <div className="flex-shrink-0">
                    {isToggleable ? (
                      <button
                        onClick={() => toggleReadiness(seg.id)}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${
                          seg.readinessConfirmed
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {seg.readinessConfirmed ? '✓ Ready' : 'Mark Ready ✓'}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-50 text-gray-300 cursor-not-allowed"
                      >
                        {seg.status === 'performing' ? '● Live' : seg.status === 'done' ? 'Done' : 'Skipped'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Back button */}
        <div className="pt-6 pb-4">
          <button
            onClick={() => useEventStore.getState().setRole(null as unknown as 'operator')}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            ← Switch Role
          </button>
        </div>
      </div>
    </div>
  )
}
