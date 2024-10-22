'use client'

import { useState, useEffect } from 'react'
import { getGasPrice, GasPrice } from '../utils/api_etherscan'
import { getTopContractsInLatestBlock, ContractGasUsage } from '../utils/api_infura'

const SUPPORTED_NETWORKS = ['mainnet', 'goerli', 'sepolia']

export default function ToolsPage() {
  const [gasPrice, setGasPrice] = useState<GasPrice | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState('mainnet')
  const [topContracts, setTopContracts] = useState<ContractGasUsage[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
    const fetchTopContracts = async () => {
      setIsLoading(true)
      try {
        const contracts = await getTopContractsInLatestBlock(selectedNetwork)
        setTopContracts(contracts)
      } catch (error) {
        console.error('Failed to fetch top contracts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopContracts()
    const interval = setInterval(fetchTopContracts, 30000) // 每30秒更新一次

    return () => clearInterval(interval)
  }, [selectedNetwork])

  const formatGasPrice = (price: string) => Number(price).toFixed(2)

  const formatGasUsed = (gasUsed: string) => {
    const ethUsed = Number(BigInt(gasUsed) / BigInt(1e9)) / 1e9 // 将 Wei 转换为 ETH
    return ethUsed.toFixed(6) // 显示6位小数
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">以太坊 Gas 价格</h1>
      {gasPrice ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">慢速 Gas 价格</h2>
            <p className="text-3xl font-bold">{formatGasPrice(gasPrice.SafeGasPrice)} Gwei</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">平均 Gas 价格</h2>
            <p className="text-3xl font-bold">{formatGasPrice(gasPrice.ProposeGasPrice)} Gwei</p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">快速 Gas 价格</h2>
            <p className="text-3xl font-bold">{formatGasPrice(gasPrice.FastGasPrice)} Gwei</p>
          </div>
        </div>
      ) : (
        <p className="mb-8">加载中...</p>
      )}

      <h2 className="text-2xl font-bold mb-4">最新区块 Top 10 合约</h2>
      <div className="mb-4">
        <label htmlFor="network-select" className="block text-sm font-medium text-gray-700 mb-2">
          选择网络
        </label>
        <select
          id="network-select"
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md"
        >
          {SUPPORTED_NETWORKS.map((network) => (
            <option key={network} value={network}>
              {network.charAt(0).toUpperCase() + network.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p>加载中...</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {topContracts.map((contract, index) => (
              <li key={contract.address} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-yellow-600 truncate">
                    {index + 1}. {contract.address}
                  </p>
                  <p className="ml-2 flex-shrink-0 font-semibold text-green-600">
                    {formatGasUsed(contract.gasUsed)} ETH
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
