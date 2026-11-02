import React, { useRef, useState, useEffect } from 'react'
import type { Segment } from '../../types/event'
import useEventStore from '../../store/useEventStore'

interface Props {
  segment: Segment
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ segment }: Props) {
  const updateSegment = useEventStore((s) => s.updateSegment)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [uploading, setUploading] = useState(false)

  const audioSrc = segment.audioFile
    ? `http://${window.location.hostname}:3001/uploads/${segment.audioFile}`
    : null

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)
    const onPause = () => setPlaying(false)
    const onPlay = () => setPlaying(true)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
    }
  }, [audioSrc])

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio || !audioSrc) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleStop = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setPlaying(false)
    setCurrentTime(0)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * duration
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('audio', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      updateSegment(segment.id, { audioFile: data.filename })
    } catch (err) {
      console.error('Upload error:', err)
      alert('Audio upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">
        Audio Player
      </div>

      {audioSrc ? (
        <>
          <audio ref={audioRef} src={audioSrc} preload="metadata" />
          <div className="text-sm text-gray-300 mb-3 truncate">
            🎵 {segment.audioFile}
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-2 bg-gray-700 rounded-full cursor-pointer mb-2 relative"
            onClick={handleSeek}
          >
            <div
              className="h-2 bg-indigo-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handlePlayPause}
              className="flex-1 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
            >
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={handleStop}
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm transition"
            >
              ⏹ Stop
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">🔊</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolume}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-xs text-gray-400 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-500 mb-4 italic">No audio file loaded.</div>
      )}

      {/* Upload */}
      <div className="mt-4 border-t border-gray-700 pt-3">
        <label className="block text-xs text-gray-400 mb-1">Upload Audio File</label>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition">
            {uploading ? 'Uploading...' : 'Choose File'}
          </span>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  )
}
