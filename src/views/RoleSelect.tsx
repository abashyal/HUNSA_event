import React from 'react'
import useEventStore from '../store/useEventStore'
import type { Role } from '../types/event'

interface RoleCard {
  role: Role
  icon: string
  title: string
  description: string
}

const roles: RoleCard[] = [
  {
    role: 'operator',
    icon: '🖥️',
    title: 'Stage Operator',
    description: 'Full control: audio, queue, program',
  },
  {
    role: 'host',
    icon: '🎤',
    title: 'Host / MC',
    description: 'Scripts, current & next performance',
  },
  {
    role: 'committee',
    icon: '📋',
    title: 'Committee',
    description: 'Program view and readiness updates',
  },
]

export default function RoleSelect() {
  const event = useEventStore((s) => s.event)
  const setRole = useEventStore((s) => s.setRole)

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight mb-2">
            HUNSA Stage Manager
          </h1>
          <p className="text-gray-500 text-lg">
            {event ? event.eventName : 'Loading event...'}
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {roles.map(({ role, icon, title, description }) => (
            <button
              key={role}
              onClick={() => setRole(role)}
              className="group flex flex-col items-center text-center bg-white border-2 border-gray-200 hover:border-indigo-500 rounded-2xl p-7 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">
                {icon}
              </span>
              <h2 className="text-lg font-bold text-gray-800 mb-1">{title}</h2>
              <p className="text-sm text-gray-500">{description}</p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          HUNSA Cultural Night · Stage Management System
        </div>
      </div>
    </div>
  )
}
