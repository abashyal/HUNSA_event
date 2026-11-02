import React from 'react'
import useEventStore from '../../store/useEventStore'

export default function EmergencyStop() {
  const event = useEventStore((s) => s.event)
  const emergencyStop = useEventStore((s) => s.emergencyStop)
  const emergencyResume = useEventStore((s) => s.emergencyResume)

  const isActive = event?.emergencyStop ?? false

  const handleStop = () => {
    if (window.confirm('⚠ Are you sure you want to trigger an EMERGENCY STOP? This will alert all connected devices.')) {
      emergencyStop()
    }
  }

  const handleResume = () => {
    emergencyResume()
  }

  if (isActive) {
    return (
      <button
        onClick={handleResume}
        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition animate-pulse"
      >
        ✅ RESUME EVENT
      </button>
    )
  }

  return (
    <button
      onClick={handleStop}
      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition"
    >
      ⚠ EMERGENCY STOP
    </button>
  )
}
