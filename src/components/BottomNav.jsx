import React from 'react'

const NAV_TABS = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12H3l9-9 9 9h-2" />
        <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        <path d="M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
      </svg>
    ),
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="9" rx="1" />
        <rect x="9.5" y="7" width="4" height="14" rx="1" />
        <rect x="16" y="3" width="4" height="18" rx="1" />
      </svg>
    ),
  },
  {
    id: 'markets',
    label: 'Markets',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="15 7 21 7 21 13" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
]

export default function BottomNav({ activeTab, onTabChange }) {
  const effectiveTab = activeTab === 'history' ? 'home' : activeTab

  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-bottom z-50" style={{ backgroundColor: 'var(--color-canvas)', borderTop: '1px solid var(--color-hairline)', transition: 'background-color 0.2s ease' }}>
      <div className="flex items-center justify-around h-16">
        {NAV_TABS.map(({ id, label, icon }) => {
          const active = effectiveTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex flex-col items-center gap-[3px] flex-1 py-2 transition-colors"
              style={{ color: active ? '#0052ff' : '#a8acb3' }}
            >
              {icon}
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: active ? '#0052ff' : '#a8acb3' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
