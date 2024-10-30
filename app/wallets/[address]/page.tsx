'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Wallet, Project } from '../../data/model'
import { walletStorageIndexedDB, projectStorageIndexedDB } from '../../utils/storage-db'
import { getAllTokenBalances, getChainName } from '../../utils/api_okx'

interface TokenBalance {
  chainIndex: string;
  tokenAddress: string;
  symbol: string;
  balance: string;
  tokenPrice: string;
  tokenType: string;
  isRiskToken: boolean;
}

export default function WalletDetailsPage() {
  const params = useParams()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([])
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isLoadingBalances, setIsLoadingBalances] = useState(true)

  // 加载钱包基本信息
  useEffect(() => {
    const loadWallet = async () => {
      if (!params.address) return;
      try {
        const wallets = await walletStorageIndexedDB.getWallets()
        const currentWallet = wallets.find(w => w.address === params.address)
        setWallet(currentWallet || null)
      } catch (error) {
        console.error('Error loading wallet:', error)
      } finally {
        setIsLoadingWallet(false)
      }
    }
    loadWallet()
  }, [params.address])

  // 加载关联项目
  useEffect(() => {
    const loadProjects = async () => {
      if (!params.address) return;
      try {
        const allProjects = await projectStorageIndexedDB.getProjects()
        const related = allProjects.filter(p => p.relatedWallets.includes(params.address as string))
        setRelatedProjects(related)
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        setIsLoadingProjects(false)
      }
    }
    loadProjects()
  }, [params.address])

  // 加载资产明细
  useEffect(() => {
    const loadBalances = async () => {
      if (!wallet || wallet.type !== 'EVM') {
        setIsLoadingBalances(false)
        return;
      }

      try {
        console.log('Loading token balances for EVM wallet:', wallet.address);
        const balances = await getAllTokenBalances(wallet.address, wallet.type)
        console.log('Loaded token balances:', balances);

        // 过滤和排序资产
        const filteredBalances = balances
          .filter(token => {
            const value = Number(token.balance) * Number(token.tokenPrice);
            const balance = Number(token.balance);
            return value > 0 || balance >= 0.0001;
          })
          .sort((a, b) => {
            const valueA = Number(a.balance) * Number(a.tokenPrice);
            const valueB = Number(b.balance) * Number(b.tokenPrice);
            return valueB - valueA;
          });

        setTokenBalances(filteredBalances)
      } catch (error) {
        console.error('Error loading balances:', error)
      } finally {
        setIsLoadingBalances(false)
      }
    }

    loadBalances()
  }, [wallet])

  if (isLoadingWallet) {
    return <div>加载钱包信息中...</div>
  }

  if (!wallet) {
    return <div>未找到钱包</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">钱包详情</h1>

      {/* 钱包基本信息 */}
      <div className="bg-yellow-100 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">基本信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-bold">地址：</p>
            <p className="break-all">{wallet.address}</p>
          </div>
          <div>
            <p className="font-bold">类型：</p>
            <p>{wallet.type}</p>
          </div>
          {wallet.alias && (
            <div>
              <p className="font-bold">别名：</p>
              <p>{wallet.alias}</p>
            </div>
          )}
          {wallet.twitter && (
            <div>
              <p className="font-bold">Twitter：</p>
              <p>{wallet.twitter}</p>
            </div>
          )}
          {wallet.email && (
            <div>
              <p className="font-bold">邮箱：</p>
              <p>{wallet.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* 关联项目 */}
      <div className="bg-yellow-100 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">关联项目</h2>
        {isLoadingProjects ? (
          <p>加载项目中...</p>
        ) : relatedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedProjects.map(project => (
              <div key={project.id} className="bg-yellow-50 p-3 rounded">
                <h3 className="font-bold">{project.name}</h3>
                <p className="text-sm">{project.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>暂无关联项目</p>
        )}
      </div>

      {/* 资产明细 */}
      {wallet.type === 'EVM' ? (
        <div className="bg-yellow-100 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">资产明细</h2>
          {isLoadingBalances ? (
            <p>加载资产中...</p>
          ) : tokenBalances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-yellow-200">
                    <th className="px-4 py-2 text-left">代币</th>
                    <th className="px-4 py-2 text-right">余额</th>
                    <th className="px-4 py-2 text-right">价值 (USD)</th>
                    <th className="px-4 py-2 text-left">网络</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenBalances.map((token, index) => (
                    <tr key={index} className="border-b border-yellow-200 hover:bg-yellow-50">
                      <td className="px-4 py-2 text-left">{token.symbol}</td>
                      <td className="px-4 py-2 text-right font-mono">{Number(token.balance).toFixed(6)}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        ${(Number(token.balance) * Number(token.tokenPrice)).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-left">{getChainName(token.chainIndex)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>暂无资产</p>
          )}
        </div>
      ) : (
        <div className="bg-yellow-100 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">资产明细</h2>
          <p className="text-gray-600">StarkNet 钱包暂不支持资产查询</p>
          <a 
            href={`https://starkscan.co/contract/${wallet.address}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:text-blue-700 mt-2 inline-block"
          >
            在 Starkscan 上查看 →
          </a>
        </div>
      )}
    </div>
  )
} 