'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, Edit2, Trash2, Info, ChevronLeft, ChevronRight, Search, Twitter, Mail } from 'lucide-react'
import Link from 'next/link'
import { Wallet, Project } from '../data/model'
import { walletStorageIndexedDB, projectStorageIndexedDB } from '../utils/storage-db'
import { getCachedTotalValue } from '../utils/api_okx'
import WalletCard from './WalletCard'

interface WalletBalance {
  value: string;
  lastUpdated: number;
}

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
  const [newWalletAlias, setNewWalletAlias] = useState('')

  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [showEditWallet, setShowEditWallet] = useState(false)

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showProjectDetails, setShowProjectDetails] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const walletsPerPage = 10

  const [searchTerm, setSearchTerm] = useState('');

  const [walletBalances, setWalletBalances] = useState<{[address: string]: WalletBalance}>({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 从 localStorage 加载缓存的余额数据
  useEffect(() => {
    const loadCachedBalances = () => {
      try {
        const cachedBalances = localStorage.getItem('walletBalances')
        if (cachedBalances) {
          const parsedBalances = JSON.parse(cachedBalances)
          // 验证缓存数据的有效性
          if (typeof parsedBalances === 'object' && parsedBalances !== null) {
            setWalletBalances(parsedBalances)
            
            // 检查是否需要刷新任何余额
            const now = Date.now()
            let needsRefresh = false
            
            Object.entries(parsedBalances).forEach(([address, balance]: [string, any]) => {
              if (!balance.lastUpdated || now - balance.lastUpdated > 60000) {
                needsRefresh = true
              }
            })

            if (needsRefresh) {
              refreshWalletBalances()
            }
          }
        }
      } catch (error) {
        console.error('Error loading cached balances:', error)
      }
    }

    loadCachedBalances()
  }, [])

  // 保存余额数据到 localStorage
  useEffect(() => {
    if (Object.keys(walletBalances).length > 0) {
      try {
        localStorage.setItem('walletBalances', JSON.stringify(walletBalances))
      } catch (error) {
        console.error('Error saving wallet balances to cache:', error)
      }
    }
  }, [walletBalances])

  const shouldRefreshBalance = (wallet: Wallet, balance?: WalletBalance) => {
    if (!balance) return true;
    if (wallet.type === 'StarkNet') return false;
    
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    return (
      Number(balance.value) === 0 ||
      now - balance.lastUpdated > oneMinute
    );
  }

  const refreshWalletBalances = async (forcedRefresh = false) => {
    setIsRefreshing(true)
    const newBalances = { ...walletBalances }
    let hasChanges = false
    
    for (const wallet of wallets) {
      const currentBalance = walletBalances[wallet.address]
      
      if (forcedRefresh || shouldRefreshBalance(wallet, currentBalance)) {
        try {
          const value = await getCachedTotalValue(wallet.address, '1')
          newBalances[wallet.address] = {
            value: value.totalValue,
            lastUpdated: Date.now()
          }
          hasChanges = true
        } catch (error) {
          console.error(`Error loading balance for ${wallet.address}:`, error)
          if (!currentBalance) {
            newBalances[wallet.address] = {
              value: '0',
              lastUpdated: Date.now()
            }
            hasChanges = true
          }
        }
      }
    }
    
    if (hasChanges) {
      setWalletBalances(newBalances)
      try {
        localStorage.setItem('walletBalances', JSON.stringify(newBalances))
      } catch (error) {
        console.error('Error saving updated balances to cache:', error)
      }
    }
    
    setIsRefreshing(false)
  }

  useEffect(() => {
    const loadData = async () => {
      const savedWallets = await walletStorageIndexedDB.getWallets()
      console.log('Loading saved wallets:', savedWallets)
      setWallets(savedWallets)
      
      const savedWalletTypes = await walletStorageIndexedDB.getWalletTypes()
      console.log('Loading saved wallet types:', savedWalletTypes)
      setWalletTypes(savedWalletTypes)

      const savedProjects = await projectStorageIndexedDB.getProjects()
      console.log('Loading saved projects:', savedProjects)
      setProjects(savedProjects)
    }
    loadData()
  }, [])

  useEffect(() => {
    refreshWalletBalances()
  }, [wallets])

  const addWallet = async () => {
    if (newWalletAddress.trim() && newWalletType) {
      // 检查钱包地址是否已存在
      const existingWallet = wallets.find(wallet => wallet.address.toLowerCase() === newWalletAddress.trim().toLowerCase());
      if (existingWallet) {
        alert('该钱包地址已存在！');
        return;
      }

      const newWallet: Wallet = { 
        address: newWalletAddress.trim(), 
        type: newWalletType,
        twitter: newWalletTwitter.trim(),
        email: newWalletEmail.trim(),
        alias: newWalletAlias.trim()
      }
      await walletStorageIndexedDB.saveWallet(newWallet)
      const updatedWallets = await walletStorageIndexedDB.getWallets()
      setWallets(updatedWallets)
      console.log('Wallets after adding:', updatedWallets) 
      
      setNewWalletAddress('')
      setNewWalletTwitter('')
      setNewWalletEmail('')
      setNewWalletAlias('')
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

  const addBulkWallets = async () => {
    const newWalletAddresses = bulkWallets.split('\n').map(address => address.trim().toLowerCase());
    const existingAddresses = wallets.map(wallet => wallet.address.toLowerCase());
    
    const duplicateAddresses = newWalletAddresses.filter(address => existingAddresses.includes(address));
    const uniqueNewAddresses = newWalletAddresses.filter(address => !existingAddresses.includes(address));

    if (duplicateAddresses.length > 0) {
      alert(`以下地址已存在，将被跳过：\n${duplicateAddresses.join('\n')}`);
    }

    const newWallets = uniqueNewAddresses.map(address => ({
      address: address,
      type: bulkWalletType,
      twitter: '',
      email: ''
    }));

    await walletStorageIndexedDB.saveWallets(newWallets);
    const updatedWallets = await walletStorageIndexedDB.getWallets();
    setWallets(updatedWallets);
    setBulkWallets('');
    setShowBulkAdd(false);

    if (uniqueNewAddresses.length > 0) {
      alert(`成功添加 ${uniqueNewAddresses.length} 个新钱`);
    }
  }

  const addWalletType = () => {
    if (newWalletTypeInput && !walletTypes.includes(newWalletTypeInput)) {
      setWalletTypes([...walletTypes, newWalletTypeInput])
      setNewWalletTypeInput('')
      setShowAddType(false)
    }
  }

  const filteredWallets = wallets.filter(wallet => 
    (filterType === 'All' || wallet.type === filterType) &&
    (wallet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (wallet.alias && wallet.alias.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const indexOfLastWallet = currentPage * walletsPerPage
  const indexOfFirstWallet = indexOfLastWallet - walletsPerPage
  const currentWallets = filteredWallets.slice(indexOfFirstWallet, indexOfLastWallet)

  const totalPages = Math.max(1, Math.ceil(filteredWallets.length / walletsPerPage))

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const editWallet = (wallet: Wallet) => {
    setEditingWallet(wallet)
    setShowEditWallet(true)
  }

  const updateWallet = async () => {
    if (editingWallet) {
      await walletStorageIndexedDB.saveWallet(editingWallet)
      const updatedWallets = await walletStorageIndexedDB.getWallets()
      setWallets(updatedWallets)
      setShowEditWallet(false)
      setEditingWallet(null)
    }
  }

  const deleteWallet = async (address: string) => {
    if (confirm('确定要删除这个钱包吗？')) {
      await walletStorageIndexedDB.deleteWallet(address)
      const updatedWallets = await walletStorageIndexedDB.getWallets()
      setWallets(updatedWallets)
    }
  }

  const getWalletDisplayName = (wallet: Wallet) => {
    if (wallet.alias) return wallet.alias;
    return wallet.twitter ? `${wallet.twitter}-${wallet.type}` : `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}-${wallet.type}`;
  }

  const getRelatedProjects = (walletAddress: string) => {
    return projects.filter(project => project.relatedWallets.includes(walletAddress))
  }

  const openProjectDetails = (project: Project) => {
    setSelectedProject(project)
    setShowProjectDetails(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('地址已复制到剪贴板')
    }, (err) => {
      console.error('无法复制文本: ', err)
    })
  }

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索钱包..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          
          {/* 钱包类型筛选 */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-primary-100 border border-primary-200 text-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
          >
            <option value="All">所有类型</option>
            {walletTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* 添加钱包按钮 */}
        <div className="flex space-x-2">
          <button
            onClick={() => setShowBulkAdd(true)}
            className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
          >
            批量导入
          </button>
          <button
            onClick={() => setShowAddWallet(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            添加钱包
          </button>
        </div>
      </div>

      {/* 钱包列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentWallets.map((wallet) => (
          <WalletCard
            key={wallet.address}
            wallet={wallet}
            balance={walletBalances[wallet.address]?.value || '0'}
            onEdit={editWallet}
            onDelete={deleteWallet}
            copyToClipboard={copyToClipboard}
          />
        ))}
      </div>

      {/* 分页控件 */}
      {filteredWallets.length > 0 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 disabled:opacity-50 disabled:hover:bg-primary-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-gray-700 font-medium">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 disabled:opacity-50 disabled:hover:bg-primary-100 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Add Wallet Modal */}
      {showAddWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-6">新增钱包</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  钱包地址
                </label>
                <input
                  type="text"
                  placeholder="输入钱包地址"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  钱包类型
                </label>
                <select
                  value={newWalletType}
                  onChange={(e) => setNewWalletType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white"
                >
                  <option value="">选择类型</option>
                  {walletTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <Twitter size={16} className="mr-2 text-primary-500" />
                    <span>Twitter (可选)</span>
                  </div>
                </label>
                <input
                  type="text"
                  placeholder="Twitter 账号"
                  value={newWalletTwitter}
                  onChange={(e) => setNewWalletTwitter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <Mail size={16} className="mr-2 text-primary-500" />
                    <span>邮箱 (可选)</span>
                  </div>
                </label>
                <input
                  type="email"
                  placeholder="邮箱地址"
                  value={newWalletEmail}
                  onChange={(e) => setNewWalletEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  别名 (可选)
                </label>
                <input
                  type="text"
                  placeholder="钱包别名"
                  value={newWalletAlias}
                  onChange={(e) => setNewWalletAlias(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowAddWallet(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button 
                onClick={addWallet}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-6">批量导入钱包</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  钱包类型
                </label>
                <select
                  value={bulkWalletType}
                  onChange={(e) => setBulkWalletType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white"
                >
                  <option value="">选择类型</option>
                  {walletTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  钱包地址列表（每行一个地址）
                </label>
                <textarea
                  value={bulkWallets}
                  onChange={(e) => setBulkWallets(e.target.value)}
                  placeholder="每行输入一个钱包地址..."
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowBulkAdd(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button 
                onClick={addBulkWallets}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
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

      {/* Edit Wallet Modal */}
      {showEditWallet && editingWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-6">编辑钱包</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  钱包地址
                </label>
                <input
                  type="text"
                  value={editingWallet.address}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    bg-gray-50 text-gray-500
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  钱包类型
                </label>
                <select
                  value={editingWallet.type}
                  onChange={(e) => setEditingWallet({...editingWallet, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white"
                >
                  {walletTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <Twitter size={16} className="mr-2 text-primary-500" />
                    <span>Twitter (可选)</span>
                  </div>
                </label>
                <input
                  type="text"
                  placeholder="Twitter 账号"
                  value={editingWallet.twitter || ''}
                  onChange={(e) => setEditingWallet({...editingWallet, twitter: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <Mail size={16} className="mr-2 text-primary-500" />
                    <span>邮箱 (可选)</span>
                  </div>
                </label>
                <input
                  type="email"
                  placeholder="邮箱地址"
                  value={editingWallet.email || ''}
                  onChange={(e) => setEditingWallet({...editingWallet, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  别名 (可选)
                </label>
                <input
                  type="text"
                  placeholder="钱包别名"
                  value={editingWallet.alias || ''}
                  onChange={(e) => setEditingWallet({...editingWallet, alias: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowEditWallet(false);
                  setEditingWallet(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button 
                onClick={updateWallet}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 项目详情模态框 */}
      {showProjectDetails && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-yellow-100 p-6 rounded-lg w-3/4 max-w-4xl my-8">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">项目详情</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-yellow-700 text-sm font-bold mb-2">项目名称</label>
                <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.name}</p>
              </div>
              <div>
                <label className="block text-yellow-700 text-sm font-bold mb-2">项目简介</label>
                <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">Discord链接</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.discord}</p>
                </div>
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">官网地址</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.website}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">Telegram链接</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.telegram}</p>
                </div>
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">Twitter链接</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.twitter}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">所处阶段</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.stage}</p>
                </div>
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">投阶段</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.airdropStage}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">预计币价格</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">${selectedProject.estimatedPrice}</p>
                </div>
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">结束时间节点</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.endDate}</p>
                </div>
              </div>
              <div>
                <label className="block text-yellow-700 text-sm font-bold mb-2">签</label>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 rounded-full text-sm bg-yellow-300 text-yellow-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <label className="block text-yellow-700 text-sm font-bold mr-2">是否为必做项目</label>
                <p className="text-yellow-800">{selectedProject.isMandatory ? '是' : '否'}</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowProjectDetails(false)} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}