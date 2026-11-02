import React from 'react'
import useEventStore from '../store/useEventStore'
import ConnectionBadge from '../components/shared/ConnectionBadge'

const typeColors: Record<string, string> = {
  performance: 'bg-purple-100 text-purple-800',
  speech: 'bg-blue-100 text-blue-800',
  break: 'bg-gray-100 text-gray-700',
  announcement: 'bg-amber-100 text-amber-800',
}

export default function HostView() {
  const event = useEventStore((s) => s.event)

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
        Connecting...
      </div>
    )
  }

  const segments = [...event.segments].sort((a, b) => a.order - b.order)
  const currentSegment = segments.find((s) => s.id === event.currentSegmentId) ?? null
  const currentIndex = currentSegment ? segments.indexOf(currentSegment) : -1

  const nextSegment =
    segments
      .slice(currentIndex + 1)
      .find((s) => s.status === 'pending' || s.status === 'ready') ?? null

  const upcoming = segments
    .filter(
      (s) =>
        s.id !== event.currentSegmentId &&
        s.id !== nextSegment?.id &&
        (s.status === 'pending' || s.status === 'ready')
    )
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-base font-bold text-gray-800 leading-tight">{event.eventName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge />
          <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
            HOST
          </span>
        </div>
      </header>

      {/* Emergency stop banner */}
      {event.emergencyStop && (
        <div className="bg-red-600 text-white text-center py-4 px-4 text-lg font-bold animate-pulse">
          ⚠ EMERGENCY STOP – Stand by
        </div>
      )}

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* NOW PERFORMING */}
        <section>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Now Performing
          </div>
          {currentSegment ? (
            <div className="bg-white border-2 border-green-400 rounded-2xl p-5 shadow">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-sm font-semibold capitalize ${
                    typeColors[currentSegment.type] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {currentSegment.type}
                </span>
                <span className="text-green-600 text-xs font-bold uppercase tracking-wide">● Live</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{currentSegment.title}</h2>
              {currentSegment.groupName && (
                <p className="text-lg text-gray-600">{currentSegment.groupName}</p>
              )}
              <p className="text-sm text-gray-400 mt-1">{currentSegment.duration} minutes</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-gray-400 italic text-lg">
              No segment currently active.
            </div>
          )}
        </section>

        {/* INTRODUCTION SCRIPT */}
        {currentSegment && (
          <section>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Introduction Script
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                {currentSegment.introScript || (
                  <span className="italic text-gray-400">No script provided.</span>
                )}
              </p>
            </div>
          </section>
        )}

        {/* NOTES */}
        {currentSegment && currentSegment.notes && (
          <section>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Notes
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-sm">
              <p className="text-base text-yellow-900 whitespace-pre-wrap">{currentSegment.notes}</p>
            </div>
          </section>
        )}

        {/* UP NEXT */}
        <section>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Up Next
          </div>
          {nextSegment ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    typeColors[nextSegment.type] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {nextSegment.type}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{nextSegment.title}</h3>
              {nextSegment.groupName && (
                <p className="text-base text-gray-500">{nextSegment.groupName}</p>
              )}
              <p className="text-sm text-gray-400 mt-1">{nextSegment.duration} min</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-gray-400 italic">
              No upcoming segment.
            </div>
          )}
        </section>

        {/* UPCOMING */}
        {upcoming.length > 0 && (
          <section>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Upcoming
            </div>
            <div className="space-y-2">
              {upcoming.map((seg) => (
                <div
                  key={seg.id}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <span className="text-gray-400 text-sm font-mono w-5">{seg.order}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      typeColors[seg.type] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {seg.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-800 truncate">{seg.title}</p>
                    {seg.groupName && (
                      <p className="text-sm text-gray-500 truncate">{seg.groupName}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{seg.duration}m</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ANNOUNCEMENTS */}
        {event.announcements.length > 0 && (
          <section>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Announcements
            </div>
            <div className="space-y-2">
              {[...event.announcements].reverse().map((a) => (
                <div
                  key={a.id}
                  className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
                >
                  <p className="text-base text-amber-900">{a.message}</p>
                  <p className="text-xs text-amber-500 mt-1">
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Back button */}
        <div className="pt-4">
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
