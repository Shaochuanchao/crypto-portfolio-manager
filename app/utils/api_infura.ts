import axios from 'axios';

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY;

const networks: { [key: string]: string } = {
  mainnet: 'https://mainnet.infura.io/v3/',
  goerli: 'https://goerli.infura.io/v3/',
  sepolia: 'https://sepolia.infura.io/v3/',
  // 添加其他网络如需要
};

interface Transaction {
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
}

interface Block {
  transactions: Transaction[];
}

export interface ContractGasUsage {
  address: string;
  gasUsed: string; // 改为 string 类型，因为 Wei 值可能很大
}

async function getLatestBlockNumber(network: string): Promise<string> {
  const response = await axios.post(`${networks[network]}${INFURA_API_KEY}`, {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_blockNumber',
    params: []
  });
  return response.data.result;
}

async function getBlockByNumber(network: string, blockNumber: string): Promise<Block> {
  const response = await axios.post(`${networks[network]}${INFURA_API_KEY}`, {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_getBlockByNumber',
    params: [blockNumber, true]
  });
  return response.data.result;
}

export async function getTopContractsInLatestBlock(network: string): Promise<ContractGasUsage[]> {
  const latestBlockNumber = await getLatestBlockNumber(network);
  const block = await getBlockByNumber(network, latestBlockNumber);

  const contractGasUsage: { [address: string]: bigint } = {};

  block.transactions.forEach(tx => {
    if (tx.to) {
      const gasUsed = BigInt(parseInt(tx.gas, 16)) * BigInt(parseInt(tx.gasPrice, 16));
      if (contractGasUsage[tx.to]) {
        contractGasUsage[tx.to] += gasUsed;
      } else {
        contractGasUsage[tx.to] = gasUsed;
      }
    }
  });

  const sortedContracts = Object.entries(contractGasUsage)
    .sort(([, a], [, b]) => Number(b - a))
    .slice(0, 10)
    .map(([address, gasUsed]) => ({ 
      address, 
      gasUsed: gasUsed.toString() // 将 bigint 转换为字符串
    }));

  return sortedContracts;
}
