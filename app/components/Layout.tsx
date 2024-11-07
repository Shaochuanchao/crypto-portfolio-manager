'use client'

import { useState, useEffect } from 'react'
import { Wallet, Coins, CheckSquare, Github, X, BookOpen, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getGasPrice, GasPrice } from '../utils/api_etherscan'
import { getCachedTokenPrice } from '../utils/api_okx'
import { exportData, importData } from '../utils/data-transfer'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('wallets')
  const [gasPrice, setGasPrice] = useState<GasPrice | null>(null)
  const [btcPrice, setBtcPrice] = useState<string>('')
  const [ethPrice, setEthPrice] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (pathname.includes('/wallets')) setActiveTab('wallets')
    else if (pathname.includes('/projects')) setActiveTab('projects')
    else if (pathname.includes('/tasks')) setActiveTab('tasks')
    else if (pathname.includes('/tools')) setActiveTab('tools')
    else if (pathname.includes('/notes')) setActiveTab('notes')
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

  useEffect(() => {
    const fetchTokenPrices = async () => {
      try {
        // 获取 BTC 价格 (chainIndex: "0" 代表比特币)
        const btcPriceData = await getCachedTokenPrice('0', '')
        setBtcPrice(Number(btcPriceData.price).toFixed(2))

        // 获取 ETH 价格 (chainIndex: "1" 代表以太坊)
        const ethPriceData = await getCachedTokenPrice('1', '')
        setEthPrice(Number(ethPriceData.price).toFixed(2))
      } catch (error) {
        console.error('Failed to fetch token prices:', error)
      }
    }

    fetchTokenPrices()
    const interval = setInterval(fetchTokenPrices, 30000) // 每30秒更新一次
    return () => clearInterval(interval)
  }, [])

  const formatGasPrice = (price: string) => Number(price).toFixed(2)

  // 处理导出数据
  const handleExport = async () => {
    try {
      await exportData()
      setShowSettings(false)
    } catch (error) {
      console.error('导出数据失败:', error)
      alert('导出数据失败')
    }
  }

  // 处理导入数据
  const handleImport = async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          await importData(file)
          setShowSettings(false)
          // 刷新页面以显示新数据
          window.location.reload()
        }
      }
      input.click()
    } catch (error) {
      console.error('导入数据失败:', error)
      alert('导入数据失败')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <CryptoLogo className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-bold text-primary-600 whitespace-nowrap">加密资产管理器</h1>
            </div>

            <div className="flex items-center justify-center space-x-1 md:space-x-4">
              <Link href="/wallets">
                <button className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                  ${activeTab === 'wallets' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <WalletIcon className="mr-2 h-5 w-5" />
                  钱包
                </button>
              </Link>
              <Link href="/projects">
                <button className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                  ${activeTab === 'projects' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <ProjectIcon className="mr-2 h-5 w-5" />
                  项目
                </button>
              </Link>
              <Link href="/tasks">
                <button className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                  ${activeTab === 'tasks' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <TaskIcon className="mr-2 h-5 w-5" />
                  每日任务
                </button>
              </Link>
              <Link href="/notes">
                <button className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                  ${activeTab === 'notes' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <NoteIcon className="mr-2 h-5 w-5" />
                  笔记
                </button>
              </Link>
            </div>

            <div className="flex-shrink-0">
              <div className="flex items-center space-x-4">
                {btcPrice && (
                  <span className="flex items-center px-3 py-2 bg-orange-50 border border-orange-200 rounded-full text-sm font-bold">
                    <BitcoinIcon className="mr-2 h-5 w-5 text-orange-500" />
                    <span className="text-orange-700">${btcPrice}</span>
                  </span>
                )}
                {ethPrice && (
                  <span className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm font-bold">
                    <EthereumIcon className="mr-2 h-5 w-5 text-blue-500" />
                    <span className="text-blue-700">${ethPrice}</span>
                  </span>
                )}
                {gasPrice && pathname !== '/tools' && (
                  <Link href="/tools" 
                    className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors whitespace-nowrap">
                    <GasIcon className="mr-2 h-5 w-5 text-primary-600" />
                    <span className="text-green-700">{formatGasPrice(gasPrice.SafeGasPrice)}</span>
                    <span className="mx-1 text-yellow-700">{formatGasPrice(gasPrice.ProposeGasPrice)}</span>
                    <span className="text-red-700">{formatGasPrice(gasPrice.FastGasPrice)}</span>
                  </Link>
                )}

                {/* 设置按钮和下拉菜单 */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors"
                  >
                    <Settings size={20} className="text-gray-600" />
                  </button>

                  {/* 设置下拉菜单 */}
                  {showSettings && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <button
                        onClick={handleExport}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        导出数据
                      </button>
                      <button
                        onClick={handleImport}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        导入数据
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-gray-600">
              <p>&copy; 2024 加密资产管理器. 保留所有权利.</p>
            </div>
            <div className="flex space-x-6">
              <a href="https://github.com/Shaochuanchao/crypto-portfolio-manager" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-600 hover:text-gray-900 flex items-center">
                <Github size={20} className="mr-2" />
                GitHub
              </a>
              <a href="https://x.com/ChuanchaoShao" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-600 hover:text-gray-900 flex items-center">
                <X size={20} className="mr-2" />
                Twitter
              </a>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>本工具仅供学习和研究使用，不构成投资建议。请谨慎使用并自行承担风险。</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// 主 Logo：工具 + 银行
const CryptoLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 21V9L12 3L20 9V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 12H16M8 16H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 8.5L12 6L15 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 17.5C15 18.3284 13.6569 19 12 19C10.3431 19 9 18.3284 9 17.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

// 钱包图标：更真实的钱包样式
const WalletIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 9H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 14C16 13.4477 16.4477 13 17 13H20V15H17C16.4477 15 16 14.5523 16 14Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const ProjectIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 3V7M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="8" y="11" width="8" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="8" y="15" width="8" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const TaskIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12L11 14L15 10M7.2 19H16.8C17.9201 19 18.4802 19 18.908 18.782C19.2843 18.5903 19.5903 18.2843 19.782 17.908C20 17.4802 20 16.9201 20 15.8V8.2C20 7.0799 20 6.51984 19.782 6.09202C19.5903 5.71569 19.2843 5.40973 18.908 5.21799C18.4802 5 17.9201 5 16.8 5H7.2C6.0799 5 5.51984 5 5.09202 5.21799C4.71569 5.40973 4.40973 5.71569 4.21799 6.09202C4 6.51984 4 7.07989 4 8.2V15.8C4 16.9201 4 17.4802 4.21799 17.908C4.40973 18.2843 4.71569 18.5903 5.09202 18.782C5.51984 19 6.07989 19 7.2 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// 笔记图标：铅笔 + 记事本
const NoteIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 13H16M8 17H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M15.4142 16.5858L17.5 18.6716V20H16.1716L14.0858 17.9142L15.4142 16.5858Z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

// Gas 图标：加油站
const GasIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20V7C4 5.89543 4.89543 5 6 5H14C15.1046 5 16 5.89543 16 7V20" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 20H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 9H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 12V8L18 6H20C20.5523 6 21 6.44772 21 7V17C21 18.1046 20.1046 19 19 19H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 9V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// Bitcoin SVG 图标
const BitcoinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.328-.525 2.107c-.345-.087-.705-.165-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.974.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.18-.24.45-.614.35.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.255 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z" fill="currentColor"/>
  </svg>
)

// Ethereum SVG 图标
const EthereumIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" fill="currentColor"/>
  </svg>
)
