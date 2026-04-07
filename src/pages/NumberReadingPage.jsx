import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  {
    title: '基本的な読み方',
    rows: [
      ['910', 'きゅうひゃくじゅう'],
      ['1820', 'せんはっぴゃくにじゅう'],
      ['450', 'よんひゃくごじゅう'],
      ['3030', 'さんぜんさんじゅう'],
    ],
  },
  {
    title: '単位',
    rows: [
      ['910mm', 'きゅうひゃくじゅうミリ'],
      ['6しゃく', '六尺 → 1820mm'],
      ['3すん', '三寸 → 90.9mm'],
      ['1.5メートル', '1.5メートル → 1500mm'],
    ],
  },
  {
    title: '四則演算',
    rows: [
      ['910 たす 455', '1365mm'],
      ['1820 ひく 303', '1517mm'],
      ['455 かける 3', '455mm × 3件登録'],
      ['1820 わる 4', '455mm × 4件登録'],
    ],
  },
  {
    title: '複数まとめて入力',
    rows: [
      ['910 と 455 と 303', '3件別々に登録'],
      ['910 つぎ 455', '2件別々に登録'],
    ],
  },
  {
    title: 'iOSの音声認識の癖',
    rows: [
      ['「910」→「900頭」', '自動補正対応済み'],
      ['「タス」「ヒク」', 'カタカナ演算子対応済み'],
      ['「900と」', '900+10=910 として認識'],
    ],
  },
]

export default function NumberReadingPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-text-muted p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-text-primary font-bold text-xl">数字の読み方</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 space-y-5">
        {SECTIONS.map((sec) => (
          <div key={sec.title}>
            <p className="text-text-muted text-xs font-bold tracking-widest uppercase mb-2 px-1">{sec.title}</p>
            <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-border">
              {sec.rows.map(([input, result]) => (
                <div key={input} className="flex items-center justify-between px-4 py-3">
                  <span className="text-brand-primary font-bold text-sm font-mono">{input}</span>
                  <span className="text-text-muted text-sm text-right ml-4">{result}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
