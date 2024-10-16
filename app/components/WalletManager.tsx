'use client'

import { useState, useEffect } from 'react'
import { PlusCircle } from 'lucide-react'
import { Wallet, walletStorage } from '../utils/storage'
import { getWalletBalance } from '../utils/api'

export default function WalletManager() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletTypes, setWalletTypes] = useState<string[]>(['EVM', 'StarkNet'])
  const [filterType, setFilterType] = useState('All')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [showAddType, setShowAddType] = useState(false)

  const [newWalletAddress, setNewWalletAddress] = useState('')
  const [newWalletType, setNewWalletType] = useState('EVM')
  const [newWalletTwitter, setNewWalletTwitter] = useState('')
  const [newWalletEmail, setNewWalletEmail] = useState('')
  const [bulkWallets, setBulkWallets] = useState('')
  const [bulkWalletType, setBulkWalletType] = useState('EVM')
  const [newWalletTypeInput, setNewWalletTypeInput] = useState('')

  const [walletBalances, setWalletBalances] = useState<{[address: string]: number}>({})

  useEffect(() => {
    setWallets(walletStorage.getWallets())
    setWalletTypes(walletStorage.getWalletTypes())
  }, [])

  useEffect(() => {
    walletStorage.saveWallets(wallets)
    walletStorage.saveWalletTypes(walletTypes)
  }, [wallets, walletTypes])

  useEffect(() => {
    async function fetchWalletBalances() {
      const balances: {[address: string]: number} = {}
      for (const wallet of wallets) {
        if (wallet.type === 'EVM') {
          try {
            console.log(`Fetching balance for wallet: ${wallet.address}`);
            balances[wallet.address] = await getWalletBalance(wallet.address)
            console.log(`Balance fetched for ${wallet.address}:`, balances[wallet.address]);
          } catch (error) {
            console.error(`Failed to fetch balance for ${wallet.address}:`, error)
            balances[wallet.address] = 0
          }
        }
      }
      console.log('All balances fetched:', balances);
      setWalletBalances(balances)
    }

    fetchWalletBalances()
  }, [wallets])

  const addWallet = () => {
    if (newWalletAddress.trim() && newWalletType) {
      setWallets([...wallets, { 
        address: newWalletAddress.trim(), 
        type: newWalletType,
        twitter: newWalletTwitter.trim(),
        email: newWalletEmail.trim()
      }])
      setNewWalletAddress('')
      setNewWalletTwitter('')
      setNewWalletEmail('')
      setShowAddWallet(false)
    } else {
      alert('钱包地址不能为空！')
    }
  }

  const getAssetLink = (wallet: Wallet) => {
    if (wallet.type === 'EVM') {
      return `https://debank.com/profile/${wallet.address}`
    } else if (wallet.type === 'StarkNet') {
      return `https://portfolio.argent.xyz/overview/${wallet.address}`
    }
    return '#'
  }

  const addBulkWallets = () => {
    const newWallets = bulkWallets.split('\n').map(address => ({
      address: address.trim(),
      type: bulkWalletType,
      twitter: '',
      email: ''
    }))
    setWallets([...wallets, ...newWallets])
    setBulkWallets('')
    setShowBulkAdd(false)
  }

  const addWalletType = () => {
    if (newWalletTypeInput && !walletTypes.includes(newWalletTypeInput)) {
      setWalletTypes([...walletTypes, newWalletTypeInput])
      setNewWalletTypeInput('')
      setShowAddType(false)
    }
  }

  const filteredWallets = filterType === 'All' ? wallets : wallets.filter(wallet => wallet.type === filterType)

  return (
    <div className="bg-yellow-100 rounded-lg p-6 shadow-lg relative">
      <h2 className="text-2xl font-bold mb-4 text-yellow-800">钱包管理</h2>
      
      {/* 气泡选择 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('All')}
          className={`px-3 py-1 rounded-full text-sm ${
            filterType === 'All' ? 'bg-yellow-500 text-yellow-900' : 'bg-yellow-200 text-yellow-700'
          }`}
        >
          所有类型
        </button>
        {walletTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-full text-sm ${
              filterType === type ? 'bg-yellow-500 text-yellow-900' : 'bg-yellow-200 text-yellow-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 添加钱包按钮 */}
      <div className="absolute top-6 right-6">
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)} 
            onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
            className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold p-2 rounded-full"
          >
            <PlusCircle size={24} />
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-yellow-100 rounded-md shadow-lg z-10">
              <button onClick={() => { setShowAddWallet(true); setShowDropdown(false); }} className="block px-4 py-2 text-sm text-yellow-800 hover:bg-yellow-200 w-full text-left">新增钱包</button>
              <button onClick={() => { setShowBulkAdd(true); setShowDropdown(false); }} className="block px-4 py-2 text-sm text-yellow-800 hover:bg-yellow-200 w-full text-left">批量导入钱包</button>
              <button onClick={() => { setShowAddType(true); setShowDropdown(false); }} className="block px-4 py-2 text-sm text-yellow-800 hover:bg-yellow-200 w-full text-left">新增钱包类型</button>
            </div>
          )}
        </div>
      </div>

      {/* 钱包列表 */}
      <div className="bg-yellow-50 rounded-md p-4 max-h-96 overflow-y-auto">
        {filteredWallets.length > 0 ? (
          filteredWallets.map((wallet, index) => (
            <div key={index} className="mb-4 p-4 bg-yellow-200 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-yellow-800 font-semibold">{wallet.address}</span>
                <span className="bg-yellow-400 px-2 py-1 rounded-full text-xs text-yellow-800">{wallet.type}</span>
              </div>
              {wallet.twitter && <p className="text-sm text-yellow-600">Twitter: {wallet.twitter}</p>}
              {wallet.email && <p className="text-sm text-yellow-600">Email: {wallet.email}</p>}
              <a 
                href={getAssetLink(wallet)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block mt-2 text-xl font-bold text-blue-500 hover:text-blue-700"
              >
                {wallet.type === 'EVM' 
                  ? `$${walletBalances[wallet.address]?.toFixed(2) || '0.00'}`
                  : '--'
                }
              </a>
            </div>
          ))
        ) : (
          <div className="text-yellow-700">没有找到匹配的钱包</div>
        )}
      </div>

      {/* Add Wallet Modal */}
      {showAddWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-yellow-100 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">新增钱包</h3>
            <input
              type="text"
              placeholder="钱包地址"
              value={newWalletAddress}
              onChange={(e) => setNewWalletAddress(e.target.value)}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <input
              type="text"
              placeholder="Twitter (可选)"
              value={newWalletTwitter}
              onChange={(e) => setNewWalletTwitter(e.target.value)}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <input
              type="email"
              placeholder="邮箱 (可选)"
              value={newWalletEmail}
              onChange={(e) => setNewWalletEmail(e.target.value)}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <select
              value={newWalletType}
              onChange={(e) => setNewWalletType(e.target.value)}
              className="w-full p-2 mb-4 bg-yellow-50 rounded-md appearance-none text-yellow-800 border border-yellow-300"
            >
              {walletTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="flex justify-end">
              <button onClick={() => setShowAddWallet(false)} className="mr-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-800 font-bold py-2 px-4 rounded">
                取消
              </button>
              <button onClick={addWallet} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-yellow-100 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">批量导入钱包</h3>
            <textarea
              placeholder="批量添加钱包地址（每行一个）"
              value={bulkWallets}
              onChange={(e) => setBulkWallets(e.target.value)}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md h-40 text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <select
              value={bulkWalletType}
              onChange={(e) => setBulkWalletType(e.target.value)}
              className="w-full p-2 mb-4 bg-yellow-50 rounded-md appearance-none text-yellow-800 border border-yellow-300"
            >
              {walletTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="flex justify-end">
              <button onClick={() => setShowBulkAdd(false)} className="mr-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-800 font-bold py-2 px-4 rounded">
                取消
              </button>
              <button onClick={addBulkWallets} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
                导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Wallet Type Modal */}
      {showAddType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-yellow-100 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">新增钱包类型</h3>
            <input
              type="text"
              placeholder="新钱包类型"
              value={newWalletTypeInput}
              onChange={(e) => setNewWalletTypeInput(e.target.value)}
              className="w-full p-2 mb-4 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <div className="flex justify-end">
              <button onClick={() => setShowAddType(false)} className="mr-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-800 font-bold py-2 px-4 rounded">
                取消
              </button>
              <button onClick={addWalletType} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
