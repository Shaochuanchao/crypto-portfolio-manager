'use client'

import { useState, useEffect } from 'react'
import { getGasPrice, GasPrice } from '../utils/api_etherscan'

export default function ToolsPage() {
  const [gasPrice, setGasPrice] = useState<GasPrice | null>(null)

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">以太坊 Gas 价格</h1>
      {gasPrice ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <p>加载中...</p>
      )}
    </div>
  )
}
