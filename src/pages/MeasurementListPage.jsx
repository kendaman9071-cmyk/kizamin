import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMeasurementStore } from '../store/useMeasurementStore'
import BottomNav from '../components/BottomNav'

export default function MeasurementListPage() {
  const navigate = useNavigate()
  const { measurements, setSelectedForCutting } = useMeasurementStore()
  const [cutExpanded, setCutExpanded] = useState(false)

  const allItems = measurements.flatMap((b) => b.items)
  const uncut = allItems.filter((i) => !i.cut)
  const cut = allItems.filter((i) => i.cut)
  const warningCount = uncut.filter((i) => i.warning).length

  const handleStartCutting = () => {
    setSelectedForCutting(uncut)
    navigate('/cutting')
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="px-4 pt-12 pb-3">
        <h1 className="text-text-primary font-bold text-xl">寸法一覧</h1>
        {warningCount > 0 && (
          <button className="mt-2 text-sm text-warning border border-warning rounded-lg px-3 py-1">
            ⚠️ 要確認 {warningCount}件
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {allItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            寸法がありません
          </div>
        ) : (
          <>
            {/* 切断済みリスト（折りたたみ） */}
            {cut.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setCutExpanded((v) => !v)}
                  className="flex items-center gap-2 text-text-muted text-sm mb-2 w-full"
                >
                  <div className="flex-1 h-px bg-border" />
                  <span className="whitespace-nowrap">
                    切断済み {cut.length}件 {cutExpanded ? '▲' : '▼'}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </button>

                <AnimatePresence>
                  {cutExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {cut.map((item) => (
                        <MeasurementItem key={item.id} item={item} cut />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 未切断リスト */}
            {uncut.map((item) => (
              <MeasurementItem key={item.id} item={item} />
            ))}
          </>
        )}
      </div>

      {uncut.length > 0 && (
        <div className="px-4 pb-8">
          <button
            onClick={handleStartCutting}
            className="w-full bg-brand-primary text-background font-bold text-lg py-4 rounded-2xl"
          >
            切断モード開始
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

function MeasurementItem({ item, cut = false }) {
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 mb-2 ${cut ? 'bg-surface/50' : 'bg-surface'}`}>
      <div>
        <span className={`font-bold text-xl ${cut ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {item.displayValue}
        </span>
        {item.memo && (
          <span className="text-text-muted text-sm ml-2">{item.memo}</span>
        )}
        {item.originalUnit && (
          <div className="text-text-muted text-xs mt-0.5">
            {item.originalUnit}: {item.originalValue}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {cut && <span className="text-success text-sm">✓</span>}
        {!cut && item.warning && <span className="text-warning">⚠️</span>}
      </div>
    </div>
  )
}
