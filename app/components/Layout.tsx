'use client'

import { useState, useEffect } from 'react'
import { Wallet, Coins, CheckSquare, Github, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getGasPrice, GasPrice } from '../utils/api_etherscan'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('wallets')
  const [gasPrice, setGasPrice] = useState<GasPrice | null>(null)

  useEffect(() => {
    if (pathname.includes('/wallets')) setActiveTab('wallets')
    else if (pathname.includes('/projects')) setActiveTab('projects')
    else if (pathname.includes('/tasks')) setActiveTab('tasks')
    else if (pathname.includes('/tools')) setActiveTab('tools')
  }, [pathname])

  useEffect(() => {
    const fetchGasPrice = async () => {
      try {
        const price = await getGasPrice()
        setGasPrice(price)
      } catch (error) {
        console.error('Failed to fetch gas price:', error)
      }
    }

    fetchGasPrice()
    const interval = setInterval(fetchGasPrice, 60000) // 每分钟更新一次

    return () => clearInterval(interval)
  }, [])

  const formatGasPrice = (price: string) => Number(price).toFixed(2)

  return (
    <div className="flex flex-col min-h-screen bg-yellow-50 text-yellow-900">
      <nav className="bg-yellow-200 p-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-800">
            加密资产管理器{activeTab === 'tools' ? ' - 工具' : ''}
          </h1>
          {gasPrice && pathname !== '/tools' && (
            <Link href="/tools" className="flex items-center">
              <div className="text-sm">
                <span className="font-bold">Gas:</span> 
                <span className="ml-1">慢 {formatGasPrice(gasPrice.SafeGasPrice)}</span>
                <span className="ml-1">平均 {formatGasPrice(gasPrice.ProposeGasPrice)}</span>
                <span className="ml-1">快 {formatGasPrice(gasPrice.FastGasPrice)}</span>
              </div>
            </Link>
          )}
          {pathname !== '/tools' && (
            <div className="flex space-x-4">
              <Link href="/wallets">
                <button
                  className={`px-4 py-2 rounded-md ${activeTab === 'wallets' ? 'bg-yellow-400' : 'bg-yellow-300'}`}
                >
                  <Wallet className="inline-block mr-2" size={18} />
                  钱包
                </button>
              </Link>
              <Link href="/projects">
                <button
                  className={`px-4 py-2 rounded-md ${activeTab === 'projects' ? 'bg-yellow-400' : 'bg-yellow-300'}`}
                >
                  <Coins className="inline-block mr-2" size={18} />
                  项目
                </button>
              </Link>
              <Link href="/tasks">
                <button
                  className={`px-4 py-2 rounded-md ${activeTab === 'tasks' ? 'bg-yellow-400' : 'bg-yellow-300'}`}
                >
                  <CheckSquare className="inline-block mr-2" size={18} />
                  每日任务
                </button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main className="container mx-auto mt-4 p-4 flex-grow">
        {children}
      </main>

      <footer className="bg-yellow-200 text-yellow-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p>&copy; 2024保留所有权利.</p>
            </div>
            <div className="flex space-x-4">
              <a href="https://github.com/Shaochuanchao/crypto-portfolio-manager" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-yellow-600">
                <Github size={20} className="mr-2" />
                GitHub
              </a>
              <a href="https://x.com/ChuanchaoShao" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-yellow-600">
                <X size={20} className="mr-2" />
                Twitter
              </a>
            </div>
          </div>
          <div className="mt-4 text-center text-sm">
            <p>本工具仅供学习和研究使用，不构成投资建议。请谨慎使用并自行承担风险。</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
