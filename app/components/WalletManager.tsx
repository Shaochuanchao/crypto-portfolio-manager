'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, Edit2, Trash2, Info, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Wallet, Project } from '../data/model'
import { walletStorageIndexedDB, projectStorageIndexedDB } from '../utils/storage-db'
import { getCachedTotalValue } from '../utils/api_okx'

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
      alert(`成功添加 ${uniqueNewAddresses.length} 个新钱包`);
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

  return (
    <div className="bg-yellow-100 rounded-lg p-6 shadow-lg relative">
      <h2 className="text-2xl font-bold mb-4 text-yellow-800 flex justify-between items-center">
        钱包管理
        <button
          onClick={() => refreshWalletBalances(true)}
          className={`text-yellow-600 hover:text-yellow-800 p-1 ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
        >
          <RefreshCw size={20} />
        </button>
      </h2>
      
      {/* 搜索框 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索钱包地址或别名"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
        />
      </div>

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
      <div className="bg-yellow-50 rounded-md p-4">
        {currentWallets.length > 0 ? (
          currentWallets.map((wallet, index) => (
            <div key={index} className="mb-4 p-4 bg-yellow-200 rounded-md relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">{getWalletDisplayName(wallet)}</h3>
                  <p className="text-yellow-700">{wallet.address}</p>
                  {wallet.twitter && <p className="text-yellow-700">Twitter: {wallet.twitter}</p>}
                  {wallet.email && <p className="text-yellow-700">Email: {wallet.email}</p>}
                  <div className="mt-2">
                    <span className="bg-yellow-300 px-2 py-1 rounded text-yellow-800 text-sm">
                      {wallet.type}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Link href={`/wallets/${wallet.address}`}>
                      <span className="text-xl font-bold text-blue-500 hover:text-blue-700 cursor-pointer">
                        ${Number(walletBalances[wallet.address]?.value || '0').toFixed(2)} →
                      </span>
                    </Link>
                  </div>
                  <div className="mt-2">
                    {getRelatedProjects(wallet.address).map((project) => (
                      <button
                        key={project.id}
                        onClick={() => openProjectDetails(project)}
                        className="mr-2 mb-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-800 text-sm px-2 py-1 rounded-full"
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/wallets/${wallet.address}`}>
                    <button className="text-yellow-600 hover:text-yellow-800 p-1">
                      <Info size={24} />
                    </button>
                  </Link>
                  <button onClick={() => editWallet(wallet)} className="text-yellow-600 hover:text-yellow-800 p-1">
                    <Edit2 size={24} />
                  </button>
                  <button onClick={() => deleteWallet(wallet.address)} className="text-yellow-600 hover:text-yellow-800 p-1">
                    <Trash2 size={24} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-yellow-700">没有找到匹配的钱包</div>
        )}
      </div>

      {/* 分页控件 */}
      {filteredWallets.length > 0 && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="mr-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="mx-2 py-2">{currentPage} / {totalPages}</span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

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
            <input
              type="text"
              placeholder="钱包别名 (可选)"
              value={newWalletAlias}
              onChange={(e) => setNewWalletAlias(e.target.value)}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
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

      {/* Edit Wallet Modal */}
      {showEditWallet && editingWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-yellow-100 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">编辑钱包</h3>
            <input
              type="text"
              placeholder="钱包地址"
              value={editingWallet.address}
              onChange={(e) => setEditingWallet({...editingWallet, address: e.target.value})}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <input
              type="text"
              placeholder="Twitter (可选)"
              value={editingWallet.twitter}
              onChange={(e) => setEditingWallet({...editingWallet, twitter: e.target.value})}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <input
              type="email"
              placeholder="邮箱 (可选)"
              value={editingWallet.email}
              onChange={(e) => setEditingWallet({...editingWallet, email: e.target.value})}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <select
              value={editingWallet.type}
              onChange={(e) => setEditingWallet({...editingWallet, type: e.target.value})}
              className="w-full p-2 mb-4 bg-yellow-50 rounded-md appearance-none text-yellow-800 border border-yellow-300"
            >
              {walletTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="钱包别名 (可选)"
              value={editingWallet.alias || ''}
              onChange={(e) => setEditingWallet({...editingWallet, alias: e.target.value})}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <div className="flex justify-end">
              <button onClick={() => setShowEditWallet(false)} className="mr-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-800 font-bold py-2 px-4 rounded">
                取消
              </button>
              <button onClick={updateWallet} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
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
                <label className="block text-yellow-700 text-sm font-bold mb-2">标签</label>
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