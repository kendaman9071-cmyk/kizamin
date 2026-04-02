import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMeasurementStore } from '../store/useMeasurementStore'

const SWIPE_THRESHOLD = 80 // px

export default function CuttingModePage() {
  const navigate = useNavigate()
  const { selectedForCutting, markAsCut } = useMeasurementStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [swipeDelta, setSwipeDelta] = useState(0) // スワイプ中のX移動量
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const isSwiping = useRef(false)

  const total = selectedForCutting.length
  const current = selectedForCutting[currentIndex]

  const handleTap = () => {
    if (current) markAsCut(current.id)
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setDone(true)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
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
    // 横方向のスワイプのみ追跡
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
      handleBack()
    }
    setSwipeDelta(0)
    touchStartX.current = null
    isSwiping.current = false
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

  if (!current) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-text-muted">
        寸法がありません
      </div>
    )
  }

  const progress = (currentIndex / total) * 100
  // スワイプ中はゲージを少し引き戻す
  const swipeProgress = progress - (swipeDelta / SWIPE_THRESHOLD) * (100 / total)
  const gaugeWidth = Math.max(0, swipeDelta > 0 ? swipeProgress : progress)
  const swipeRatio = Math.min(swipeDelta / SWIPE_THRESHOLD, 1) // 0〜1

  return (
    <div
      className="flex flex-col h-screen bg-background select-none"
      onClick={!isSwiping.current ? handleTap : undefined}
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
            {currentIndex + 1} / {total}
          </span>
          <button
            onClick={(e) => { e.stopPropagation() }}
            className="text-text-muted text-sm"
          >
            ➕ 追加
          </button>
        </div>
        {/* プログレスバー（スワイプ右で連動して引き戻る） */}
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-primary rounded-full"
            animate={{ width: `${gaugeWidth}%` }}
            transition={swipeDelta > 0 ? { duration: 0 } : { duration: 0.3 }}
          />
        </div>
        {/* スワイプ中のヒント */}
        {swipeRatio > 0.2 && currentIndex > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: swipeRatio }}
            className="text-text-muted text-xs text-center mt-1"
          >
            ← 前の寸法に戻る
          </motion.p>
        )}
      </div>

      {/* メイン寸法表示 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="dimension-display text-text-primary">
              {current.value}
              <span className="text-text-muted text-3xl font-normal ml-2">mm</span>
            </div>

            {current.memo && (
              <p className="text-text-secondary text-xl mt-3">{current.memo}</p>
            )}

            {current.displayValue !== `${current.value}mm` && (
              <p className="text-text-muted text-base mt-2">{current.displayValue}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ヒント */}
        <p className="text-text-muted text-xs mt-8">
          タップで次へ　　右スワイプで前に戻る
        </p>
      </div>
    </div>
  )
}
