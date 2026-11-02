export type SegmentType = 'performance' | 'speech' | 'break' | 'announcement'
export type SegmentStatus = 'pending' | 'ready' | 'performing' | 'done' | 'skipped'
export type Role = 'operator' | 'host' | 'committee'

export interface Segment {
  id: string
  order: number
  type: SegmentType
  title: string
  groupName: string
  duration: number
  audioFile?: string | null
  introScript: string
  notes: string
  status: SegmentStatus
  readinessConfirmed: boolean
}

export interface Announcement {
  id: string
  message: string
  timestamp: number
}

export interface EventState {
  eventName: string
  currentSegmentId: string | null
  segments: Segment[]
  announcements: Announcement[]
  isLive: boolean
  emergencyStop: boolean
}
