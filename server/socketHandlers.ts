import type { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'
import { getState, setState } from './eventStore.js'
import type { Segment } from '../src/types/event.js'

function broadcast(io: Server): void {
  io.emit('state:full', getState())
}

export function registerHandlers(io: Server, socket: Socket): void {
  // segment:start
  socket.on('segment:start', (id: string) => {
    const state = getState()
    const seg = state.segments.find((s) => s.id === id)
    if (!seg) return
    seg.status = 'performing'
    state.currentSegmentId = id
    setState(state)
    broadcast(io)
  })

  // segment:complete
  socket.on('segment:complete', (id: string) => {
    const state = getState()
    const seg = state.segments.find((s) => s.id === id)
    if (!seg) return
    seg.status = 'done'

    // Advance to next pending/ready segment
    const sorted = [...state.segments].sort((a, b) => a.order - b.order)
    const currentIndex = sorted.findIndex((s) => s.id === id)
    const next = sorted.slice(currentIndex + 1).find((s) => s.status === 'pending' || s.status === 'ready')
    state.currentSegmentId = next ? next.id : null

    setState(state)
    broadcast(io)
  })

  // segment:skip
  socket.on('segment:skip', (id: string) => {
    const state = getState()
    const seg = state.segments.find((s) => s.id === id)
    if (!seg) return
    seg.status = 'skipped'

    // If skipping the current segment, advance
    if (state.currentSegmentId === id) {
      const sorted = [...state.segments].sort((a, b) => a.order - b.order)
      const currentIndex = sorted.findIndex((s) => s.id === id)
      const next = sorted.slice(currentIndex + 1).find((s) => s.status === 'pending' || s.status === 'ready')
      state.currentSegmentId = next ? next.id : null
    }

    setState(state)
    broadcast(io)
  })

  // segment:add
  socket.on('segment:add', (data: Omit<Segment, 'id' | 'order'>) => {
    const state = getState()
    const maxOrder = state.segments.reduce((max, s) => Math.max(max, s.order), 0)
    const newSegment: Segment = {
      id: uuidv4(),
      order: maxOrder + 1,
      type: data.type,
      title: data.title,
      groupName: data.groupName,
      duration: data.duration,
      audioFile: data.audioFile ?? null,
      introScript: data.introScript,
      notes: data.notes,
      status: data.status ?? 'pending',
      readinessConfirmed: data.readinessConfirmed ?? false,
    }
    state.segments.push(newSegment)
    setState(state)
    broadcast(io)
  })

  // segment:update
  socket.on('segment:update', (payload: { id: string; updates: Partial<Segment> }) => {
    const state = getState()
    const seg = state.segments.find((s) => s.id === payload.id)
    if (!seg) return
    Object.assign(seg, payload.updates)
    setState(state)
    broadcast(io)
  })

  // segment:delete
  socket.on('segment:delete', (id: string) => {
    const state = getState()
    state.segments = state.segments.filter((s) => s.id !== id)
    if (state.currentSegmentId === id) {
      // Find next available
      const sorted = [...state.segments].sort((a, b) => a.order - b.order)
      const next = sorted.find((s) => s.status === 'pending' || s.status === 'ready')
      state.currentSegmentId = next ? next.id : null
    }
    setState(state)
    broadcast(io)
  })

  // segment:reorder
  socket.on('segment:reorder', (ids: string[]) => {
    const state = getState()
    const segMap = new Map(state.segments.map((s) => [s.id, s]))
    const reordered: Segment[] = []
    ids.forEach((id, index) => {
      const seg = segMap.get(id)
      if (seg) {
        seg.order = index + 1
        reordered.push(seg)
      }
    })
    // Include any segments not in the ids array at the end
    state.segments.forEach((s) => {
      if (!ids.includes(s.id)) {
        s.order = reordered.length + 1
        reordered.push(s)
      }
    })
    state.segments = reordered
    setState(state)
    broadcast(io)
  })

  // readiness:toggle
  socket.on('readiness:toggle', (id: string) => {
    const state = getState()
    const seg = state.segments.find((s) => s.id === id)
    if (!seg) return
    seg.readinessConfirmed = !seg.readinessConfirmed
    if (seg.readinessConfirmed && seg.status === 'pending') {
      seg.status = 'ready'
    } else if (!seg.readinessConfirmed && seg.status === 'ready') {
      seg.status = 'pending'
    }
    setState(state)
    broadcast(io)
  })

  // announcement:push
  socket.on('announcement:push', (message: string) => {
    const state = getState()
    state.announcements.push({
      id: uuidv4(),
      message,
      timestamp: Date.now(),
    })
    setState(state)
    broadcast(io)
  })

  // announcement:clear
  socket.on('announcement:clear', () => {
    const state = getState()
    state.announcements = []
    setState(state)
    broadcast(io)
  })

  // emergency:stop
  socket.on('emergency:stop', () => {
    const state = getState()
    state.emergencyStop = true
    setState(state)
    broadcast(io)
  })

  // emergency:resume
  socket.on('emergency:resume', () => {
    const state = getState()
    state.emergencyStop = false
    setState(state)
    broadcast(io)
  })

  // event:reset
  socket.on('event:reset', () => {
    const state = getState()
    state.segments = state.segments.map((s) => ({
      ...s,
      status: 'pending',
      readinessConfirmed: false,
    }))
    state.currentSegmentId = null
    state.emergencyStop = false
    setState(state)
    broadcast(io)
  })

  // event:rename
  socket.on('event:rename', (name: string) => {
    const state = getState()
    state.eventName = name
    setState(state)
    broadcast(io)
  })
}
