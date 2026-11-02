import React from 'react'
import useEventStore from '../../store/useEventStore'

export default function ConnectionBadge() {
  const connected = useEventStore((s) => s.connected)

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${
          connected ? 'bg-green-400' : 'bg-red-500 animate-pulse'
        }`}
      />
      {connected ? (
        <span className="text-green-400 font-medium">Connected</span>
      ) : (
        <span className="text-red-400 font-medium">Reconnecting...</span>
      )}
    </div>
  )
}
