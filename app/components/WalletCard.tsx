import { Wallet } from '../data/model'
import { Copy, Edit2, Trash2, ExternalLink, Twitter, Mail } from 'lucide-react'
import Link from 'next/link'

interface WalletCardProps {
  wallet: Wallet
  balance: string
  onEdit: (wallet: Wallet) => void
  onDelete: (address: string) => void
  copyToClipboard: (text: string) => void
}

export default function WalletCard({
  wallet,
  balance,
  onEdit,
  onDelete,
  copyToClipboard
}: WalletCardProps) {
  const getWalletDisplayName = () => {
    if (wallet.alias) return wallet.alias;
    return wallet.twitter ? `${wallet.twitter}-${wallet.type}` : `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}-${wallet.type}`;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* 头部：类型标签和操作按钮 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
          {wallet.type}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(wallet)}
            className="text-gray-400 hover:text-primary-600 transition-colors"
            title="编辑钱包"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => onDelete(wallet.address)}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="删除钱包"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="p-4">
        {/* 钱包名称和地址 */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {getWalletDisplayName()}
          </h3>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 font-mono truncate pr-8">
              {wallet.address}
            </div>
            <button
              onClick={() => copyToClipboard(wallet.address)}
              className="text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0"
              title="复制地址"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* 社交信息 */}
        <div className="space-y-2 mb-3">
          {wallet.twitter && (
            <div className="flex items-center text-sm text-gray-600">
              <Twitter size={16} className="mr-2 text-primary-500" />
              <span className="text-primary-600">{wallet.twitter}</span>
            </div>
          )}
          {wallet.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail size={16} className="mr-2 text-primary-500" />
              <span className="text-primary-600">{wallet.email}</span>
            </div>
          )}
        </div>

        {/* 资产价值和详情链接 */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary-600">
            ${Number(balance).toFixed(2)}
          </div>
          <Link 
            href={`/wallets/${wallet.address}`}
            className="inline-flex items-center px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full text-sm font-medium hover:bg-primary-100 transition-colors"
          >
            查看详情
            <ExternalLink size={14} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  )
} 