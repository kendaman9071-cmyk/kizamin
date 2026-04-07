import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMeasurementStore } from '../store/useMeasurementStore'

const STORAGE_KEY = 'kizamin-projects'

function loadProjects() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveProjects(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { measurements, itemOrder, selectedForCutting, clearAll } = useMeasurementStore()
  const setStore = useMeasurementStore.setState

  const [projects, setProjects] = useState(loadProjects)
  const [newName, setNewName] = useState('')
  const [confirmLoad, setConfirmLoad] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const totalItems = measurements.flatMap((b) => b.items).length

  const handleSave = () => {
    const name = newName.trim() || `プロジェクト ${projects.length + 1}`
    const project = {
      id: Date.now(),
      name,
      timestamp: new Date().toISOString(),
      measurements,
      itemOrder,
      selectedForCutting,
    }
    const next = [project, ...projects]
    setProjects(next)
    saveProjects(next)
    setNewName('')
  }

  const handleLoad = (project) => {
    // zustand ストアに直接セット
    useMeasurementStore.setState({
      measurements: project.measurements,
      itemOrder: project.itemOrder || [],
      selectedForCutting: project.selectedForCutting || [],
    })
    // persist に反映
    const stored = JSON.parse(localStorage.getItem('kizamin-measurements') || '{}')
    stored.state = {
      measurements: project.measurements,
      itemOrder: project.itemOrder || [],
      selectedForCutting: project.selectedForCutting || [],
    }
    localStorage.setItem('kizamin-measurements', JSON.stringify(stored))
    setConfirmLoad(null)
    navigate(-1)
  }

  const handleDelete = (id) => {
    const next = projects.filter((p) => p.id !== id)
    setProjects(next)
    saveProjects(next)
    setConfirmDelete(null)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-text-muted p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-text-primary font-bold text-xl">プロジェクト管理</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 space-y-5">

        {/* 現在のデータを保存 */}
        <div className="bg-surface rounded-2xl p-4 space-y-3">
          <p className="text-text-muted text-xs font-bold tracking-widest uppercase">現在のデータを保存</p>
          <p className="text-text-muted text-xs">現在 {totalItems}件 の寸法データ</p>
          <div className="flex gap-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="プロジェクト名（省略可）"
              className="flex-1 bg-background text-text-primary text-sm rounded-xl px-3 py-2.5 border border-border focus:outline-none focus:border-brand-primary" />
            <button onClick={handleSave} disabled={totalItems === 0}
              className="px-4 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-sm disabled:opacity-40">
              保存
            </button>
          </div>
        </div>

        {/* 保存済みプロジェクト一覧 */}
        {projects.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">保存済みのプロジェクトはありません</p>
        ) : (
          <div>
            <p className="text-text-muted text-xs font-bold tracking-widest uppercase mb-2 px-1">保存済み</p>
            <div className="space-y-2">
              <AnimatePresence>
                {projects.map((p) => {
                  const count = p.measurements?.flatMap((b) => b.items).length ?? 0
                  const date  = new Date(p.timestamp).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  return (
                    <motion.div key={p.id} exit={{ opacity: 0, height: 0 }}
                      className="bg-surface rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-text-primary font-bold text-sm truncate">{p.name}</p>
                          <p className="text-text-muted text-xs mt-0.5">{count}件 · {date}</p>
                        </div>
                        <div className="flex gap-2 ml-3">
                          <button onClick={() => setConfirmLoad(p)}
                            className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold">
                            読込
                          </button>
                          <button onClick={() => setConfirmDelete(p.id)}
                            className="w-8 h-8 rounded-lg bg-danger/20 flex items-center justify-center">
                            <svg width="12" height="12" stroke="#FF4444" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* 読込確認 */}
      <AnimatePresence>
        {confirmLoad && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-surface rounded-2xl p-6 w-full">
              <h2 className="text-text-primary font-bold text-lg mb-2">「{confirmLoad.name}」を読み込みますか？</h2>
              <p className="text-text-muted text-sm mb-5">現在のデータは上書きされます。</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmLoad(null)}
                  className="flex-1 py-3 rounded-xl border border-border text-text-muted font-bold">キャンセル</button>
                <button onClick={() => handleLoad(confirmLoad)}
                  className="flex-1 py-3 rounded-xl bg-brand-primary text-white font-bold">読み込む</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 削除確認 */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-surface rounded-2xl p-6 w-full">
              <h2 className="text-text-primary font-bold text-lg mb-2">削除しますか？</h2>
              <p className="text-text-muted text-sm mb-5">この操作は取り消せません。</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 rounded-xl border border-border text-text-muted font-bold">キャンセル</button>
                <button onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-3 rounded-xl bg-danger text-white font-bold">削除</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
