import React, { useState } from 'react'
import type { Segment, SegmentType, SegmentStatus } from '../../types/event'
import useEventStore from '../../store/useEventStore'

async function uploadAudioFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('audio', file)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return data.filename as string
}

const typeColors: Record<string, string> = {
  performance: 'bg-purple-700 text-purple-100',
  speech: 'bg-blue-700 text-blue-100',
  break: 'bg-gray-600 text-gray-100',
  announcement: 'bg-amber-600 text-amber-100',
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-600 text-gray-200',
  ready: 'bg-blue-600 text-blue-100',
  performing: 'bg-green-600 text-green-100',
  done: 'bg-gray-700 text-gray-400',
  skipped: 'bg-yellow-700 text-yellow-100',
}

interface FormData {
  title: string
  groupName: string
  type: SegmentType
  duration: string
  introScript: string
  notes: string
}

const defaultForm: FormData = {
  title: '',
  groupName: '',
  type: 'performance',
  duration: '5',
  introScript: '',
  notes: '',
}

export default function PerformanceQueue() {
  const event = useEventStore((s) => s.event)
  const startSegment = useEventStore((s) => s.startSegment)
  const completeSegment = useEventStore((s) => s.completeSegment)
  const skipSegment = useEventStore((s) => s.skipSegment)
  const addSegment = useEventStore((s) => s.addSegment)
  const updateSegment = useEventStore((s) => s.updateSegment)
  const deleteSegment = useEventStore((s) => s.deleteSegment)
  const reorderSegments = useEventStore((s) => s.reorderSegments)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<FormData>(defaultForm)
  const [editForms, setEditForms] = useState<Record<string, FormData>>({})
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const handleAudioUpload = async (segId: string, file: File) => {
    setUploadingId(segId)
    try {
      const filename = await uploadAudioFile(file)
      updateSegment(segId, { audioFile: filename })
    } catch {
      alert('Audio upload failed.')
    } finally {
      setUploadingId(null)
    }
  }

  const handleAudioRemove = (segId: string) => {
    updateSegment(segId, { audioFile: null })
  }

  if (!event) return <div className="text-gray-400 p-4">Loading...</div>

  const segments = [...event.segments].sort((a, b) => a.order - b.order)

  const handleDragStart = (id: string) => setDraggingId(id)
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    setDragOverId(id)
  }
  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }
    const ids = segments.map((s) => s.id)
    const fromIndex = ids.indexOf(draggingId)
    const toIndex = ids.indexOf(targetId)
    const newIds = [...ids]
    newIds.splice(fromIndex, 1)
    newIds.splice(toIndex, 0, draggingId)
    reorderSegments(newIds)
    setDraggingId(null)
    setDragOverId(null)
  }

  const toggleExpand = (id: string, seg: Segment) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      setEditForms((prev) => ({
        ...prev,
        [id]: {
          title: seg.title,
          groupName: seg.groupName,
          type: seg.type,
          duration: String(seg.duration),
          introScript: seg.introScript,
          notes: seg.notes,
        },
      }))
    }
  }

  const handleEditSave = (id: string) => {
    const f = editForms[id]
    if (!f) return
    updateSegment(id, {
      title: f.title,
      groupName: f.groupName,
      type: f.type,
      duration: parseInt(f.duration) || 0,
      introScript: f.introScript,
      notes: f.notes,
    })
    setExpandedId(null)
  }

  const handleAddSubmit = () => {
    if (!addForm.title.trim()) return
    addSegment({
      type: addForm.type,
      title: addForm.title,
      groupName: addForm.groupName,
      duration: parseInt(addForm.duration) || 0,
      audioFile: null,
      introScript: addForm.introScript,
      notes: addForm.notes,
      status: 'pending' as SegmentStatus,
      readinessConfirmed: false,
    })
    setAddForm(defaultForm)
    setShowAddForm(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white">Performance Queue</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition"
        >
          + Add Segment
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 bg-gray-700 rounded-lg p-4 border border-gray-600">
          <h3 className="text-sm font-semibold text-white mb-3">New Segment</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              className="col-span-2 bg-gray-800 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500"
              placeholder="Title *"
              value={addForm.title}
              onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className="bg-gray-800 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500"
              placeholder="Group / Performer"
              value={addForm.groupName}
              onChange={(e) => setAddForm((f) => ({ ...f, groupName: e.target.value }))}
            />
            <select
              className="bg-gray-800 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500"
              value={addForm.type}
              onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value as SegmentType }))}
            >
              <option value="performance">Performance</option>
              <option value="speech">Speech</option>
              <option value="break">Break</option>
              <option value="announcement">Announcement</option>
            </select>
            <input
              type="number"
              className="bg-gray-800 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500"
              placeholder="Duration (min)"
              value={addForm.duration}
              onChange={(e) => setAddForm((f) => ({ ...f, duration: e.target.value }))}
            />
          </div>
          <textarea
            className="w-full bg-gray-800 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500 mb-2 resize-none"
            rows={2}
            placeholder="Intro script..."
            value={addForm.introScript}
            onChange={(e) => setAddForm((f) => ({ ...f, introScript: e.target.value }))}
          />
          <textarea
            className="w-full bg-gray-800 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500 mb-3 resize-none"
            rows={2}
            placeholder="Notes..."
            value={addForm.notes}
            onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddSubmit}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition"
            >
              Add
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddForm(defaultForm) }}
              className="px-4 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {segments.map((seg) => {
          const isExpanded = expandedId === seg.id
          const isDragOver = dragOverId === seg.id
          const isCurrent = event.currentSegmentId === seg.id

          return (
            <div
              key={seg.id}
              draggable
              onDragStart={() => handleDragStart(seg.id)}
              onDragOver={(e) => handleDragOver(e, seg.id)}
              onDrop={() => handleDrop(seg.id)}
              onDragLeave={() => setDragOverId(null)}
              className={`rounded-lg border transition-all ${
                isCurrent
                  ? 'border-green-500 bg-gray-750'
                  : isDragOver
                  ? 'border-indigo-400 bg-gray-700'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              } ${seg.status === 'done' ? 'opacity-60' : ''}`}
            >
              {/* Row */}
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                onClick={() => toggleExpand(seg.id, seg)}
              >
                <span className="text-gray-500 cursor-grab text-lg select-none">⠿</span>
                <span className="text-gray-400 text-xs w-5 text-center font-mono">{seg.order}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize flex-shrink-0 ${
                    typeColors[seg.type] || 'bg-gray-600 text-gray-100'
                  }`}
                >
                  {seg.type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${isCurrent ? 'text-green-400' : 'text-white'}`}>
                    {seg.title}
                  </div>
                  {seg.groupName && (
                    <div className="text-xs text-gray-500 truncate">{seg.groupName}</div>
                  )}
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{seg.duration}m</span>
                {seg.audioFile && (
                  <span className="text-xs flex-shrink-0" title={seg.audioFile}>🎵</span>
                )}
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize flex-shrink-0 ${
                    statusColors[seg.status] || 'bg-gray-600 text-gray-200'
                  }`}
                >
                  {seg.status}
                </span>

                {/* Action buttons */}
                <div
                  className="flex gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(seg.status === 'pending' || seg.status === 'ready') && (
                    <button
                      onClick={() => startSegment(seg.id)}
                      className="px-2 py-0.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded transition"
                    >
                      Start
                    </button>
                  )}
                  {seg.status === 'performing' && (
                    <>
                      <button
                        onClick={() => completeSegment(seg.id)}
                        className="px-2 py-0.5 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded transition"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => skipSegment(seg.id)}
                        className="px-2 py-0.5 bg-yellow-700 hover:bg-yellow-600 text-white text-xs rounded transition"
                      >
                        Skip
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded edit form */}
              {isExpanded && (
                <div
                  className="border-t border-gray-700 px-3 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      className="col-span-2 bg-gray-900 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500"
                      placeholder="Title"
                      value={editForms[seg.id]?.title ?? seg.title}
                      onChange={(e) =>
                        setEditForms((prev) => ({
                          ...prev,
                          [seg.id]: { ...prev[seg.id], title: e.target.value },
                        }))
                      }
                    />
                    <input
                      className="bg-gray-900 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500"
                      placeholder="Group / Performer"
                      value={editForms[seg.id]?.groupName ?? seg.groupName}
                      onChange={(e) =>
                        setEditForms((prev) => ({
                          ...prev,
                          [seg.id]: { ...prev[seg.id], groupName: e.target.value },
                        }))
                      }
                    />
                    <select
                      className="bg-gray-900 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500"
                      value={editForms[seg.id]?.type ?? seg.type}
                      onChange={(e) =>
                        setEditForms((prev) => ({
                          ...prev,
                          [seg.id]: { ...prev[seg.id], type: e.target.value as SegmentType },
                        }))
                      }
                    >
                      <option value="performance">Performance</option>
                      <option value="speech">Speech</option>
                      <option value="break">Break</option>
                      <option value="announcement">Announcement</option>
                    </select>
                    <input
                      type="number"
                      className="bg-gray-900 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500"
                      placeholder="Duration (min)"
                      value={editForms[seg.id]?.duration ?? String(seg.duration)}
                      onChange={(e) =>
                        setEditForms((prev) => ({
                          ...prev,
                          [seg.id]: { ...prev[seg.id], duration: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <textarea
                    className="w-full bg-gray-900 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500 mb-2 resize-none"
                    rows={2}
                    placeholder="Intro script..."
                    value={editForms[seg.id]?.introScript ?? seg.introScript}
                    onChange={(e) =>
                      setEditForms((prev) => ({
                        ...prev,
                        [seg.id]: { ...prev[seg.id], introScript: e.target.value },
                      }))
                    }
                  />
                  <textarea
                    className="w-full bg-gray-900 text-white text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500 mb-3 resize-none"
                    rows={2}
                    placeholder="Notes..."
                    value={editForms[seg.id]?.notes ?? seg.notes}
                    onChange={(e) =>
                      setEditForms((prev) => ({
                        ...prev,
                        [seg.id]: { ...prev[seg.id], notes: e.target.value },
                      }))
                    }
                  />
                  {/* Audio file */}
                  <div className="mb-3 border border-gray-600 rounded-lg p-2">
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
                      🎵 Audio File
                    </div>
                    {seg.audioFile ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400 flex-1 truncate">{seg.audioFile}</span>
                        <label className="cursor-pointer px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition">
                          {uploadingId === seg.id ? 'Uploading...' : 'Replace'}
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            disabled={uploadingId === seg.id}
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) handleAudioUpload(seg.id, f)
                            }}
                          />
                        </label>
                        <button
                          onClick={() => handleAudioRemove(seg.id)}
                          className="px-2 py-1 bg-red-800 hover:bg-red-700 text-white text-xs rounded transition"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs rounded transition">
                          {uploadingId === seg.id ? 'Uploading...' : '+ Upload Audio'}
                        </span>
                        <span className="text-xs text-gray-500 italic">No audio file</span>
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          disabled={uploadingId === seg.id}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleAudioUpload(seg.id, f)
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSave(seg.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this segment?')) {
                          deleteSegment(seg.id)
                          setExpandedId(null)
                        }
                      }}
                      className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
