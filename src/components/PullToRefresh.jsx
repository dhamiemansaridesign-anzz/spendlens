import React, { useRef, useState, useCallback, useEffect } from 'react'

const THRESHOLD = 64   // px of pull before refresh triggers
const INDICATOR_H = 44 // height of the spinner area

export default function PullToRefresh({ onRefresh, children }) {
  const scrollRef = useRef(null)
  const startYRef = useRef(0)
  const pullYRef = useRef(0)
  const activeRef = useRef(false)    // true while finger is pulling
  const refreshingRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)

  const [displayY, setDisplayY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  // Always keep the latest onRefresh without recreating handlers
  useEffect(() => { onRefreshRef.current = onRefresh }, [onRefresh])

  const handleTouchStart = useCallback((e) => {
    const el = scrollRef.current
    if (!el || el.scrollTop > 2) return
    startYRef.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (refreshingRef.current) return
    const el = scrollRef.current
    if (!el || el.scrollTop > 2) { activeRef.current = false; return }

    const delta = e.touches[0].clientY - startYRef.current
    if (delta <= 4) { activeRef.current = false; return }

    // Prevent browser's native overscroll / back navigation
    e.preventDefault()
    activeRef.current = true
    // Rubber-band resistance: pull slows as it extends
    const y = Math.min(delta * 0.42, THRESHOLD + 24)
    pullYRef.current = y
    setDisplayY(y)
  }, [])

  const handleTouchEnd = useCallback(async () => {
    if (!activeRef.current) return
    activeRef.current = false

    const y = pullYRef.current
    pullYRef.current = 0

    if (y >= THRESHOLD && onRefreshRef.current) {
      setDisplayY(INDICATOR_H)
      refreshingRef.current = true
      setRefreshing(true)
      try {
        await onRefreshRef.current()
      } finally {
        refreshingRef.current = false
        setRefreshing(false)
        setDisplayY(0)
      }
    } else {
      setDisplayY(0)
    }
  }, [])

  // Non-passive touchmove so e.preventDefault() works
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const progress = Math.min(displayY / THRESHOLD, 1)

  return (
    <div
      ref={scrollRef}
      className="hide-scrollbar"
      style={{
        height: '100%',
        overflowY: 'auto',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        style={{
          transform: `translateY(${displayY}px)`,
          // activeRef is read at render time — false after touchEnd triggers setState
          transition: activeRef.current
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
      >
        {/* Spinner — sits above content via negative margin, revealed by translateY */}
        <div
          style={{
            height: INDICATOR_H,
            marginTop: -INDICATOR_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: '2.5px solid #0052ff',
              borderTopColor: 'transparent',
              opacity: refreshing ? 1 : progress,
              transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
              animation: refreshing ? 'ptr-spin 0.75s linear infinite' : 'none',
            }}
          />
        </div>

        {children}
      </div>
    </div>
  )
}
