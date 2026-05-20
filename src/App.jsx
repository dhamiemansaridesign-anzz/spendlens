import React, { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import AnalysisScreen from './screens/AnalysisScreen'
import MarketsScreen from './screens/MarketsScreen'
import HistoryScreen from './screens/HistoryScreen'
import SettingsScreen from './screens/SettingsScreen'
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'

function AppShell() {
  const { user, authLoading } = useApp()
  const [activeTab, setActiveTab] = useState('home')

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <div className="flex flex-col min-h-dvh bg-canvas">
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && <HomeScreen onViewHistory={() => setActiveTab('history')} />}
        {activeTab === 'history' && <HistoryScreen onBack={() => setActiveTab('home')} />}
        {activeTab === 'analysis' && <AnalysisScreen />}
        {activeTab === 'markets' && <MarketsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <InstallPrompt />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
