import axios from 'axios';

const API_ENDPOINT = 'https://api.etherscan.io/api';
const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;

export interface GasPrice {
  SafeGasPrice: string;
  ProposeGasPrice: string;
  FastGasPrice: string;
}

export async function getGasPrice(): Promise<GasPrice> {
  try {
    const response = await axios.get(`${API_ENDPOINT}?module=gastracker&action=gasoracle&apikey=${API_KEY}`);
    if (response.data.status === '1') {
      return response.data.result;
    } else {
      throw new Error(response.data.message || 'Failed to fetch gas price');
    }
  } catch (error) {
    console.error('Error fetching gas price:', error);
    throw error;
  }
}
