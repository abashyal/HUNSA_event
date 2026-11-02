import { create } from 'zustand'
import socket from '../socket'
import type { EventState, Role, Segment } from '../types/event'

interface EventStore {
  event: EventState | null
  role: Role | null
  connected: boolean

  // Actions
  setRole: (role: Role) => void
  startSegment: (id: string) => void
  completeSegment: (id: string) => void
  skipSegment: (id: string) => void
  addSegment: (seg: Omit<Segment, 'id' | 'order'>) => void
  updateSegment: (id: string, updates: Partial<Segment>) => void
  deleteSegment: (id: string) => void
  reorderSegments: (ids: string[]) => void
  toggleReadiness: (id: string) => void
  pushAnnouncement: (message: string) => void
  clearAnnouncements: () => void
  emergencyStop: () => void
  emergencyResume: () => void
  resetEvent: () => void
  renameEvent: (name: string) => void
}

const useEventStore = create<EventStore>((set) => {
  // Set up socket listeners immediately
  socket.on('state:full', (event: EventState) => {
    set({ event })
  })

  socket.on('connect', () => {
    set({ connected: true })
  })

  socket.on('disconnect', () => {
    set({ connected: false })
  })

  return {
    event: null,
    role: null,
    connected: false,

    setRole: (role: Role) => set({ role }),

    startSegment: (id: string) => {
      socket.emit('segment:start', id)
    },

    completeSegment: (id: string) => {
      socket.emit('segment:complete', id)
    },

    skipSegment: (id: string) => {
      socket.emit('segment:skip', id)
    },

    addSegment: (seg: Omit<Segment, 'id' | 'order'>) => {
      socket.emit('segment:add', seg)
    },

    updateSegment: (id: string, updates: Partial<Segment>) => {
      socket.emit('segment:update', { id, updates })
    },

    deleteSegment: (id: string) => {
      socket.emit('segment:delete', id)
    },

    reorderSegments: (ids: string[]) => {
      socket.emit('segment:reorder', ids)
    },

    toggleReadiness: (id: string) => {
      socket.emit('readiness:toggle', id)
    },

    pushAnnouncement: (message: string) => {
      socket.emit('announcement:push', message)
    },

    clearAnnouncements: () => {
      socket.emit('announcement:clear')
    },

    emergencyStop: () => {
      socket.emit('emergency:stop')
    },

    emergencyResume: () => {
      socket.emit('emergency:resume')
    },

    resetEvent: () => {
      socket.emit('event:reset')
    },

    renameEvent: (name: string) => {
      socket.emit('event:rename', name)
    },
  }
})

export default useEventStore
