import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  {
    path: '/input',
    label: '入力',
    icon: (active) => (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" fill={active ? 'currentColor' : 'none'} />
        <path d="M19 11a7 7 0 0 1-14 0M12 18v4M8 22h8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/list',
    label: '一覧',
    icon: (active) => (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/cutting',
    label: '切断',
    icon: (active) => (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="6" cy="6" r="3" fill={active ? 'currentColor' : 'none'} />
        <circle cx="6" cy="18" r="3" fill={active ? 'currentColor' : 'none'} />
        <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="flex items-center justify-around bg-surface border-t border-border pb-safe pt-2">
      {navItems.map((item) => {
        const active = pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
              active ? 'text-brand-primary' : 'text-text-muted'
            }`}
          >
            {item.icon(active)}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
