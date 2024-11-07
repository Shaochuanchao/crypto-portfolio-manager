'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Wallet, Project } from '../../data/model'
import { walletStorageIndexedDB, projectStorageIndexedDB } from '../../utils/storage-db'
import { getAllTokenBalances, getChainName } from '../../utils/api_okx'
import { ExternalLink, Copy, ArrowLeft } from 'lucide-react'
import Card from '../../components/Card'

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
  const router = useRouter()
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
    <div className="container mx-auto p-4 space-y-6">
      {/* 返回按钮和标题 */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={20} className="mr-1" />
          返回
        </button>
        <h1 className="text-2xl font-bold text-gray-900">钱包详情</h1>
      </div>

      {/* 基本信息卡片 */}
      <Card title="基本信息">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">地址</h3>
            <div className="flex items-center space-x-2">
              <p className="text-gray-900 font-mono">{wallet?.address}</p>
              <button
                onClick={() => navigator.clipboard.writeText(wallet?.address || '')}
                className="text-gray-400 hover:text-primary-600 transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">类型</h3>
            <p className="text-gray-900">{wallet?.type}</p>
          </div>
          {wallet?.alias && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">别名</h3>
              <p className="text-gray-900">{wallet.alias}</p>
            </div>
          )}
          {wallet?.twitter && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Twitter</h3>
              <p className="text-gray-900">{wallet.twitter}</p>
            </div>
          )}
          {wallet?.email && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">邮箱</h3>
              <p className="text-gray-900">{wallet.email}</p>
            </div>
          )}
        </div>
      </Card>

      {/* 关联项目卡片 */}
      <Card title="关联项目">
        {isLoadingProjects ? (
          <p className="text-gray-500">加载项目中...</p>
        ) : relatedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedProjects.map(project => (
              <div key={project.id} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{project.description}</p>
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    访问网站
                    <ExternalLink size={14} className="ml-1" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">暂无关联项目</p>
        )}
      </Card>

      {/* 资产明细卡片 */}
      {wallet.type === 'EVM' ? (
        <Card title="资产明细">
          {isLoadingBalances ? (
            <p className="text-gray-500">加载资产中...</p>
          ) : tokenBalances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">代币</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">余额</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">价值 (USD)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">网络</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tokenBalances.map((token, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{token.symbol}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                        {Number(token.balance).toFixed(6)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                        ${(Number(token.balance) * Number(token.tokenPrice)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{getChainName(token.chainIndex)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">暂无资产</p>
          )}
        </Card>
      ) : (
        <Card title="资产明细">
          <div className="text-gray-500">
            <p>StarkNet 钱包暂不支持资产查询</p>
            <a 
              href={`https://starkscan.co/contract/${wallet.address}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center mt-2 text-primary-600 hover:text-primary-700"
            >
              在 Starkscan 上查看
              <ExternalLink size={14} className="ml-1" />
            </a>
          </div>
        </Card>
      )}
    </div>
  )
} 