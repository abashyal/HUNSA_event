import React, { useState } from 'react'
import useEventStore from '../store/useEventStore'
import ConnectionBadge from '../components/shared/ConnectionBadge'
import PerformanceCard from '../components/shared/PerformanceCard'
import AudioPlayer from '../components/laptop/AudioPlayer'
import PerformanceQueue from '../components/laptop/PerformanceQueue'
import EmergencyStop from '../components/laptop/EmergencyStop'

export default function LaptopView() {
  const event = useEventStore((s) => s.event)
  const pushAnnouncement = useEventStore((s) => s.pushAnnouncement)
  const clearAnnouncements = useEventStore((s) => s.clearAnnouncements)
  const renameEvent = useEventStore((s) => s.renameEvent)
  const resetEvent = useEventStore((s) => s.resetEvent)
  const emergencyResume = useEventStore((s) => s.emergencyResume)

  const [announcementText, setAnnouncementText] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
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

  const handleSendAnnouncement = () => {
    if (announcementText.trim()) {
      pushAnnouncement(announcementText.trim())
      setAnnouncementText('')
    }
  }

  const handleRename = () => {
    if (nameInput.trim()) {
      renameEvent(nameInput.trim())
    }
    setEditingName(false)
  }

  const handleReset = () => {
    if (window.confirm('Reset all segments to pending? This cannot be undone.')) {
      resetEvent()
    }
  }

  // Emergency stop overlay
  if (event.emergencyStop) {
    return (
      <div className="min-h-screen bg-red-700 flex flex-col items-center justify-center text-white">
        <div className="text-6xl mb-6 animate-pulse">⚠</div>
        <h1 className="text-4xl font-extrabold tracking-widest uppercase mb-4">
          Emergency Stop Active
        </h1>
        <p className="text-red-200 text-lg mb-10">All performances are paused.</p>
        <button
          onClick={emergencyResume}
          className="px-10 py-4 bg-white text-red-700 text-xl font-bold rounded-2xl hover:bg-red-100 transition shadow-lg"
        >
          ✅ Resume Event
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-6 py-3 flex items-center gap-4">
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              className="bg-gray-800 text-white text-lg font-bold rounded px-3 py-1 border border-indigo-500 focus:outline-none"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingName(false) }}
              autoFocus
            />
            <button onClick={handleRename} className="text-green-400 text-sm hover:text-green-300">Save</button>
            <button onClick={() => setEditingName(false)} className="text-gray-400 text-sm hover:text-gray-300">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => { setEditingName(true); setNameInput(event.eventName) }}
            className="text-xl font-bold text-white hover:text-indigo-400 transition flex-1 text-left"
          >
            {event.eventName}
          </button>
        )}
        <ConnectionBadge />
        <EmergencyStop />
      </header>

      {/* Main layout: 3 columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column */}
        <div className="w-1/4 min-w-0 flex flex-col gap-3 p-4 border-r border-gray-800 overflow-y-auto">
          {/* Current segment */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Now Playing</div>
            {currentSegment ? (
              <PerformanceCard segment={currentSegment} label="NOW PLAYING" />
            ) : (
              <div className="rounded-lg bg-gray-800 border border-gray-700 p-4 text-gray-500 text-sm italic">
                No segment active
              </div>
            )}
          </div>

          {/* Audio player */}
          {currentSegment && <AudioPlayer segment={currentSegment} />}

          {/* Next segment */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Up Next</div>
            {nextSegment ? (
              <PerformanceCard segment={nextSegment} label="UP NEXT" />
            ) : (
              <div className="rounded-lg bg-gray-800 border border-gray-700 p-4 text-gray-500 text-sm italic">
                No upcoming segment
              </div>
            )}
          </div>

          {/* Announcements panel */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Announcements</div>
            <textarea
              className="w-full bg-gray-900 text-white text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-indigo-500 resize-none mb-2"
              rows={2}
              placeholder="Type announcement..."
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAnnouncement() } }}
            />
            <button
              onClick={handleSendAnnouncement}
              disabled={!announcementText.trim()}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium rounded transition mb-2"
            >
              Send
            </button>
            {event.announcements.length > 0 && (
              <>
                <div className="space-y-1 max-h-40 overflow-y-auto mb-2">
                  {[...event.announcements].reverse().map((a) => (
                    <div key={a.id} className="bg-amber-900 text-amber-100 text-xs rounded px-2 py-1">
                      {a.message}
                    </div>
                  ))}
                </div>
                <button
                  onClick={clearAnnouncements}
                  className="w-full py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition"
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Center column — Performance Queue */}
        <div className="flex-1 min-w-0 p-4 overflow-hidden flex flex-col">
          <PerformanceQueue />
        </div>

        {/* Right column — Event controls */}
        <div className="w-1/4 min-w-0 p-4 border-l border-gray-800 overflow-y-auto">
          <h2 className="text-base font-bold text-white mb-4">Event Controls</h2>

          {/* Rename event */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Rename Event</div>
            <input
              className="w-full bg-gray-900 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500 mb-2"
              defaultValue={event.eventName}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value.trim() !== event.eventName) {
                  renameEvent(e.target.value.trim())
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim()
                  if (val) renameEvent(val)
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
            />
          </div>

          {/* Live toggle */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Event Status</div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${event.isLive ? 'text-green-400' : 'text-gray-400'}`}>
                {event.isLive ? '🟢 LIVE' : '⚪ Not Live'}
              </span>
            </div>
          </div>

          {/* Segments summary */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Summary</div>
            <div className="space-y-1 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Total segments</span>
                <span className="font-mono">{event.segments.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed</span>
                <span className="font-mono text-green-400">{event.segments.filter((s) => s.status === 'done').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending</span>
                <span className="font-mono text-gray-400">{event.segments.filter((s) => s.status === 'pending' || s.status === 'ready').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Skipped</span>
                <span className="font-mono text-yellow-400">{event.segments.filter((s) => s.status === 'skipped').length}</span>
              </div>
            </div>
          </div>

          {/* Reset event */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Danger Zone</div>
            <button
              onClick={handleReset}
              className="w-full py-2 bg-red-800 hover:bg-red-700 text-white text-sm font-medium rounded transition"
            >
              🔄 Reset All Segments
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
