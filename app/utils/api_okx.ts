import axios from 'axios';
import { chainStorageIndexedDB } from './storage-db';

const API_KEY = process.env.NEXT_PUBLIC_OKX_API_KEY;
const SECRET_KEY = process.env.NEXT_PUBLIC_OKX_SECRET_KEY;
const PASSPHRASE = process.env.NEXT_PUBLIC_OKX_PASSPHRASE;
const PROJECT_ID = process.env.NEXT_PUBLIC_OKX_PROJECT_ID;

const BASE_URL = 'https://www.okx.com/';

interface Chain {
  name: string;
  logoUrl: string;
  shortName: string;
  chainIndex: string;
  lastUpdated?: string;
}

interface TokenBalance {
  chainIndex: string;
  chainName?: string;
  tokenAddress: string;
  symbol: string;
  balance: string;
  tokenPrice: string;
  tokenType: string;
  isRiskToken: boolean;
}

interface TotalValue {
  totalValue: string;
}

interface TokenPrice {
  chainIndex: string;
  tokenAddress: string;
  price: string;
  time: string;
}

// 更新 EVM 链的索引列表
const EVM_CHAIN_INDEXES = [
  '1',    // Ethereum Mainnet
  '10',   // Optimism
  '56',   // BNB Smart Chain
  '137',  // Polygon
  '42161',// Arbitrum One
  '324',  // zkSync Era
  '1101', // Polygon zkEVM
  '8453', // Base
  '59144',// Linea
  '534352',// Scroll
  '204',  // opBNB
  '169',  // Manta Pacific
  '1285', // Moonriver
  '42220',// Celo
  '43114',// Avalanche
];

// 链名称映射
const CHAIN_NAMES: { [key: string]: string } = {
  '1': 'Ethereum',
  '10': 'Optimism',
  '56': 'BSC',
  '137': 'Polygon',
  '42161': 'Arbitrum',
  '324': 'zkSync Era',
  '1101': 'Polygon zkEVM',
  '8453': 'Base',
  '59144': 'Linea',
  '534352': 'Scroll',
  '204': 'opBNB',
  '169': 'Manta Pacific',
  '2222': 'Kava',
  '100': 'Gnosis',
  '1284': 'Moonbeam',
  '1285': 'Moonriver',
  '42220': 'Celo',
  '43114': 'Avalanche',
  '250': 'Fantom',
  '1088': 'Metis',
  '1666600': 'Harmony',
};

// 生成签名
async function generateSignature(timestamp: string, method: string, requestPath: string, body: string = '') {
  if (!SECRET_KEY) {
    console.error('SECRET_KEY is not set');
    throw new Error('SECRET_KEY is not set');
  }

  const preHash = timestamp + method + requestPath + body;
  console.log('PreHash string:', preHash);

  const encoder = new TextEncoder();
  const messageBuffer = encoder.encode(preHash);
  const keyBuffer = encoder.encode(SECRET_KEY);

  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageBuffer
    );

    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const base64Signature = btoa(String.fromCharCode.apply(null, signatureArray));
    
    console.log('Generated signature:', base64Signature);
    return base64Signature;
  } catch (error) {
    console.error('Error generating signature:', error);
    throw error;
  }
}

// 获取请求头
async function getHeaders(method: string, requestPath: string, body: string = '') {
  if (!API_KEY || !SECRET_KEY || !PASSPHRASE || !PROJECT_ID) {
    console.error('Missing required environment variables');
    throw new Error('Missing required environment variables');
  }

  const timestamp = new Date().toISOString().slice(0, -5) + 'Z';
  console.log('Timestamp:', timestamp);

  const sign = await generateSignature(timestamp, method, requestPath, body);

  const headers = {
    'OK-ACCESS-KEY': API_KEY,
    'OK-ACCESS-SIGN': sign,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': PASSPHRASE,
    'OK-ACCESS-PROJECT': PROJECT_ID,
    'Content-Type': 'application/json',
  };

  console.log('Request headers:', headers);
  return headers;
}

// 请求限制管理
class RequestRateLimiter {
  private queue: (() => Promise<any>)[] = [];
  private requestsThisSecond = 0;
  private lastRequestTime = Date.now();
  private readonly maxRequestsPerSecond = 5;
  private processing = false;

  async addRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const now = Date.now();
    
    if (now - this.lastRequestTime >= 1000) {
      // 重置计数器
      this.requestsThisSecond = 0;
      this.lastRequestTime = now;
    }

    if (this.requestsThisSecond < this.maxRequestsPerSecond) {
      const request = this.queue.shift();
      if (request) {
        this.requestsThisSecond++;
        try {
          await request();
        } catch (error) {
          console.error('Error processing request:', error);
        }
      }
      // 使用 setTimeout 替代 setImmediate，延迟设为 0
      setTimeout(() => this.processQueue(), 0);
    } else {
      // 等待到下一秒
      const timeToWait = 1000 - (now - this.lastRequestTime);
      setTimeout(() => this.processQueue(), timeToWait);
    }
  }
}

const rateLimiter = new RequestRateLimiter();

// 修改 API 请求函数
export async function getTotalValue(address: string, chains: string): Promise<TotalValue> {
  const path = `/api/v5/wallet/asset/total-value-by-address?address=${address}&chains=${chains}`;
  
  return rateLimiter.addRequest(async () => {
    const headers = await getHeaders('GET', path);
    try {
      const response = await axios.get(`${BASE_URL}${path}`, { headers });
      console.log('Total value response:', response.data);
      if (response.data.code === '0') {
        return response.data.data[0];
      }
      throw new Error(response.data.msg || 'Failed to fetch total value');
    } catch (error) {
      console.error('Error fetching total value:', error);
      throw error;
    }
  });
}

// 修改获取代币余额的函数
export async function getAllTokenBalances(address: string, walletType: string): Promise<TokenBalance[]> {
  // 根据钱包类型选择要查询的链
  const chains = walletType === 'EVM' ? EVM_CHAIN_INDEXES : ['1'];
  
  // 将所有链ID用逗号连接
  const chainsParam = chains.join(',');
  
  const path = `/api/v5/wallet/asset/all-token-balances-by-address?address=${address}&chains=${chainsParam}`;
  
  return rateLimiter.addRequest(async () => {
    const headers = await getHeaders('GET', path);
    try {
      const response = await axios.get(`${BASE_URL}${path}`, { headers });
      console.log('Token balances response:', response.data);
      if (response.data.code === '0' && response.data.data && response.data.data[0]) {
        const balances = response.data.data[0].tokenAssets || [];
        // 为每个余额添加链名称
        return balances.map((balance: TokenBalance) => ({
          ...balance,
          chainName: CHAIN_NAMES[balance.chainIndex] || `Chain ${balance.chainIndex}`
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  });
}

// 修改缓存管理
const cache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_DURATION = 60000; // 1分钟缓存

export async function getCachedTotalValue(address: string, chains: string): Promise<TotalValue> {
  const cacheKey = `totalValue-${address}-${chains}`;
  const now = Date.now();

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    return cache[cacheKey].data;
  }

  const data = await getTotalValue(address, chains);
  cache[cacheKey] = { data, timestamp: now };
  return data;
}

export async function getSupportedChains(): Promise<Chain[]> {
  const path = '/api/v5/wallet/chain/supported-chains';
  const headers = await getHeaders('GET', path);

  try {
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    if (response.data.code === '0') {
      const chains = response.data.data;
      // 添加最后更新时间
      const chainsWithTimestamp = chains.map((chain: Chain) => ({
        ...chain,
        lastUpdated: new Date().toISOString()
      }));
      await chainStorageIndexedDB.saveChains(chainsWithTimestamp);
      return chainsWithTimestamp;
    }
    throw new Error(response.data.msg || 'Failed to fetch supported chains');
  } catch (error) {
    console.error('Error fetching supported chains:', error);
    throw error;
  }
}

// 导出链名称映射，供其他组件使用
export function getChainName(chainIndex: string): string {
  return CHAIN_NAMES[chainIndex] || chainIndex;
}

// 获取实时币价
export async function getCurrentPrice(tokens: { chainIndex: string; tokenAddress: string }[]): Promise<TokenPrice[]> {
  const path = '/api/v5/wallet/token/current-price';
  const body = JSON.stringify(tokens);
  const headers = await getHeaders('POST', path, body);

  try {
    const response = await axios.post(`${BASE_URL}${path}`, tokens, { headers });
    console.log('Current price response:', response.data);
    if (response.data.code === '0') {
      return response.data.data;
    }
    throw new Error(response.data.msg || 'Failed to fetch current price');
  } catch (error) {
    console.error('Error fetching current price:', error);
    throw error;
  }
}

// 缓存管理
const priceCache: { [key: string]: { data: TokenPrice; timestamp: number } } = {};
const PRICE_CACHE_DURATION = 30000; // 30秒缓存

export async function getCachedTokenPrice(chainIndex: string, tokenAddress: string = ''): Promise<TokenPrice> {
  const cacheKey = `${chainIndex}-${tokenAddress}`;
  const now = Date.now();

  if (priceCache[cacheKey] && now - priceCache[cacheKey].timestamp < PRICE_CACHE_DURATION) {
    return priceCache[cacheKey].data;
  }

  const tokens = [{ chainIndex, tokenAddress }];
  const prices = await getCurrentPrice(tokens);
  if (prices && prices.length > 0) {
    priceCache[cacheKey] = { data: prices[0], timestamp: now };
    return prices[0];
  }
  throw new Error('Failed to fetch token price');
}