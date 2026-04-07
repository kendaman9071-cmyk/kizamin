import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMeasurementStore } from '../store/useMeasurementStore'
import { useSpeechRecognition } from '../utils/useSpeechRecognition'
import { parseVoiceInput } from '../utils/measurementParser'
import { getSetting } from '../utils/settings'
import { playCutSound } from '../utils/sounds'

const CUTTING_FONT_STYLE = {
  sm: { fontSize: 'clamp(3rem, 15vw, 6rem)' },
  md: { fontSize: 'clamp(4rem, 18vw, 7.5rem)' },
  lg: { fontSize: 'clamp(5rem, 22vw, 9rem)' },
}

const SWIPE_THRESHOLD = 80
const PROGRESS_KEY = 'kizamin-cutting-progress'

export default function CuttingModePage() {
  const navigate = useNavigate()
  const { selectedForCutting, markAsCut, markAsUncut, addToSelectedForCutting } = useMeasurementStore()
  const [showAddModal, setShowAddModal] = useState(false)

  // 同じ値をグループ化
  const groups = useMemo(() => {
    const result = []
    const map = new Map()
    for (const item of selectedForCutting) {
      const key = item.value ?? item.displayValue
      if (!map.has(key)) {
        map.set(key, result.length)
        result.push({
          value: item.value,
          displayValue: item.displayValue,
          memo: item.memo,
          items: [],
        })
      }
      result[map.get(key)].items.push(item)
    }
    return result
  }, [selectedForCutting])

  const totalItems = selectedForCutting.length

  // 進捗をsessionStorageから復元
  const [groupIndex, setGroupIndex] = useState(() => {
    try {
      const saved = sessionStorage.getItem(PROGRESS_KEY)
      if (saved) {
        const { gIdx, selectedLen } = JSON.parse(saved)
        if (selectedLen === selectedForCutting.length) return gIdx
      }
    } catch {}
    return 0
  })
  const [doneInGroup, setDoneInGroup] = useState(() => {
    try {
      const saved = sessionStorage.getItem(PROGRESS_KEY)
      if (saved) {
        const { dIdx, selectedLen } = JSON.parse(saved)
        if (selectedLen === selectedForCutting.length) return dIdx
      }
    } catch {}
    return 0
  })
  const [done, setDone] = useState(false)

  // 誤タップ防止
  const [pendingTap, setPendingTap] = useState(false)
  const lastTapTime = useRef(0)
  const pendingTimer = useRef(null)

  // 進捗をsessionStorageに保存
  useEffect(() => {
    sessionStorage.setItem(PROGRESS_KEY, JSON.stringify({
      gIdx: groupIndex,
      dIdx: doneInGroup,
      selectedLen: selectedForCutting.length,
    }))
  }, [groupIndex, doneInGroup, selectedForCutting.length])

  // 画面スリープ防止（WakeLock）
  useEffect(() => {
    if (!getSetting('wakeLock')) return
    let wakeLock = null
    const acquire = async () => {
      try {
        wakeLock = await navigator.wakeLock?.request('screen')
      } catch {}
    }
    acquire()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      wakeLock?.release().catch(() => {})
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const [swipeDelta, setSwipeDelta] = useState(0)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const isSwiping = useRef(false)
  const didSwipe = useRef(false)  // スワイプ後のclick誤発火を防ぐ

  const currentGroup = groups[groupIndex]
  const remaining = currentGroup ? currentGroup.items.length - doneInGroup : 0

  // 全体の進捗（完了した件数）
  const completedCount = groups.slice(0, groupIndex).reduce((s, g) => s + g.items.length, 0) + doneInGroup
  const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0
  const swipeProgress = progress - (swipeDelta / SWIPE_THRESHOLD) * (100 / totalItems)
  const gaugeWidth = Math.max(0, swipeDelta > 0 ? swipeProgress : progress)
  const swipeRatio = Math.min(swipeDelta / SWIPE_THRESHOLD, 1)

  const confirmCut = () => {
    if (!currentGroup) return
    playCutSound()
    if (getSetting('vibration')) navigator.vibrate?.(50)

    const item = currentGroup.items[doneInGroup]
    if (item) markAsCut(item.id)

    const nextDone = doneInGroup + 1
    if (nextDone < currentGroup.items.length) {
      setDoneInGroup(nextDone)
    } else {
      const nextGroup = groupIndex + 1
      if (nextGroup < groups.length) {
        setGroupIndex(nextGroup)
        setDoneInGroup(0)
      } else {
        sessionStorage.removeItem(PROGRESS_KEY)
        setDone(true)
      }
    }
  }

  const handleTap = () => {
    if (!currentGroup) return

    if (getSetting('doubleTap')) {
      const now = Date.now()
      if (!pendingTap || now - lastTapTime.current > 1500) {
        // 1回目タップ
        lastTapTime.current = now
        setPendingTap(true)
        clearTimeout(pendingTimer.current)
        pendingTimer.current = setTimeout(() => setPendingTap(false), 1500)
        return
      }
      // 2回目タップ（確定）
      clearTimeout(pendingTimer.current)
      setPendingTap(false)
    }

    confirmCut()
  }

  const handleBack = () => {
    if (doneInGroup > 0) {
      // 同グループ内を戻る：直前に切断したアイテムを取り消し
      const prevItem = currentGroup.items[doneInGroup - 1]
      if (prevItem) markAsUncut(prevItem.id)
      setDoneInGroup((d) => d - 1)
    } else if (groupIndex > 0) {
      // 前のグループに戻る：そのグループの最後のアイテムを取り消し
      const prevGroup = groups[groupIndex - 1]
      const prevItem = prevGroup.items[prevGroup.items.length - 1]
      if (prevItem) markAsUncut(prevItem.id)
      setGroupIndex((i) => i - 1)
      setDoneInGroup(prevGroup.items.length - 1)
    } else {
      // 最初のカードでスワイプ → 一覧に戻る
      navigate('/list')
    }
  }

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false
  }

  const onTouchMove = (e) => {
    if (touchStartX.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (!isSwiping.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwiping.current = true
    }
    if (isSwiping.current && dx > 0) {
      setSwipeDelta(Math.min(dx, SWIPE_THRESHOLD * 1.5))
    }
  }

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - (touchStartX.current ?? 0)
    if (isSwiping.current && dx >= SWIPE_THRESHOLD) {
      didSwipe.current = true
      handleBack()
    }
    setSwipeDelta(0)
    touchStartX.current = null
    isSwiping.current = false
  }

  const handleClick = () => {
    // スワイプ直後のclick誤発火を無視
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    handleTap()
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl"
        >
          ✅
        </motion.div>
        <p className="text-text-primary font-bold text-2xl">全件完了</p>
        <button
          onClick={() => navigate('/input')}
          className="bg-brand-primary text-background font-bold px-8 py-3 rounded-2xl"
        >
          入力画面に戻る
        </button>
      </div>
    )
  }

  if (!currentGroup) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-text-muted">
        寸法がありません
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-screen bg-background select-none"
      style={{ touchAction: 'none' }}
      onClick={handleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ゲージ＋コントロール */}
      <div className="px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/list') }}
            className="text-text-muted text-sm"
          >
            ⏸ 一時停止
          </button>
          <span className="text-text-muted text-sm font-medium">
            {completedCount + 1} / {totalItems}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAddModal(true) }}
              className="text-text-muted text-sm"
            >
              ➕ 追加
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/settings') }}
              className="text-text-muted p-1"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-primary rounded-full"
            animate={{ width: `${gaugeWidth}%` }}
            transition={swipeDelta > 0 ? { duration: 0 } : { duration: 0.3 }}
          />
        </div>
        {swipeRatio > 0.2 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: swipeRatio }}
            className={`text-xs text-center mt-1 font-medium ${completedCount > 0 ? 'text-warning' : 'text-text-muted'}`}
          >
            {completedCount > 0 ? '← 切断を取り消して戻る' : '← 一覧に戻る'}
          </motion.p>
        )}
      </div>

      {/* メイン寸法表示 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${groupIndex}-${remaining}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="dimension-display text-text-primary"
              style={CUTTING_FONT_STYLE[getSetting('cuttingFont')] ?? CUTTING_FONT_STYLE.md}>
              {currentGroup.value}
              <span className="text-text-muted text-3xl font-normal ml-2">mm</span>
            </div>

            {/* ×N カウントダウン */}
            {remaining > 1 && (
              <motion.div
                key={remaining}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-2"
              >
                <span className="text-brand-light font-bold text-4xl">×{remaining}</span>
              </motion.div>
            )}

            {currentGroup.memo && (
              <p className="text-text-secondary text-xl mt-3">{currentGroup.memo}</p>
            )}

            {currentGroup.displayValue !== `${currentGroup.value}mm` && (
              <p className="text-text-muted text-base mt-2">{currentGroup.displayValue}</p>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {pendingTap ? (
            <motion.p
              key="confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-brand-primary text-sm font-bold mt-8"
            >
              もう一度タップで確定
            </motion.p>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-text-muted text-xs mt-8"
            >
              タップで次へ　　右スワイプで前に戻る
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddModal
            onClose={() => setShowAddModal(false)}
            onAdd={(results) => addToSelectedForCutting(results)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── 追加モーダル ────────────────────────────────────────────────────
function AddModal({ onClose, onAdd }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  const handleVoiceResult = useCallback((results) => {
    onAdd(results)
    onClose()
  }, [onAdd, onClose])

  const { isRecording, interimText, toggle, isSupported } = useSpeechRecognition({
    onResult: handleVoiceResult,
    gracePeriodMs: 1500,
  })

  const handleSubmit = () => {
    const t = text.trim()
    if (!t) return
    const results = parseVoiceInput(t)
    if (results.length > 0) {
      onAdd(results)
      onClose()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="bg-surface rounded-t-2xl p-6 w-full pb-12"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-text-primary font-bold text-lg mb-4">寸法を追加</h2>

        <div className="flex gap-2 items-stretch mb-3">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="例: 910  910たす455  6しゃく"
            className="flex-1 bg-background text-text-primary text-xl font-bold rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-brand-primary"
            autoFocus
          />
          {isSupported && (
            <motion.button
              onTap={toggle}
              whileTap={{ scale: 0.92 }}
              className={`flex-shrink-0 w-14 rounded-xl flex items-center justify-center ${
                isRecording ? 'bg-danger' : 'bg-brand-primary'
              }`}
            >
              {isRecording ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-4 h-4 bg-white rounded-sm"
                />
              ) : (
                <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
                  <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm7 9a1 1 0 0 1 1 1 8 8 0 0 1-7 7.938V23h-2v-2.062A8 8 0 0 1 4 13a1 1 0 0 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1z"/>
                </svg>
              )}
            </motion.button>
          )}
        </div>

        {isRecording && (
          <p className="text-text-muted text-sm mb-3 px-1">
            {interimText || '話してください...'}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border text-text-muted font-bold"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-brand-primary text-white font-bold"
          >
            追加
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
