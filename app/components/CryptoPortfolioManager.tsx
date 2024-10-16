'use client'

import { useState } from 'react'
import { Wallet, Coins, CheckSquare } from 'lucide-react'
import WalletManager from './WalletManager'
import ProjectManager from './ProjectManager'
import DailyTaskTracker from './DailyTaskTracker'

export default function CryptoPortfolioManager() {
  const [activeTab, setActiveTab] = useState('wallets')

  return (
    <div className="min-h-screen bg-yellow-50 text-yellow-900">
      <nav className="bg-yellow-200 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-800">加密资产管理器</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('wallets')}
              className={`px-4 py-2 rounded-md ${activeTab === 'wallets' ? 'bg-yellow-400' : 'bg-yellow-300'}`}
            >
              <Wallet className="inline-block mr-2" size={18} />
              钱包
            </button>
            <button
              onClick={() => setActiveTab('airdrops')}
              className={`px-4 py-2 rounded-md ${activeTab === 'airdrops' ? 'bg-yellow-400' : 'bg-yellow-300'}`}
            >
              <Coins className="inline-block mr-2" size={18} />
              空投
            </button>
            <button
              onClick={() => setActiveTab('dailyTasks')}
              className={`px-4 py-2 rounded-md ${activeTab === 'dailyTasks' ? 'bg-yellow-400' : 'bg-yellow-300'}`}
            >
              <CheckSquare className="inline-block mr-2" size={18} />
              每日任务
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto mt-8 p-4">
        {activeTab === 'wallets' && <WalletManager />}
        {activeTab === 'airdrops' && <ProjectManager />}
        {activeTab === 'dailyTasks' && <DailyTaskTracker />}
      </main>
    </div>
  )
}