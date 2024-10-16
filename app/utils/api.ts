import { getApiKey } from './apiKeyManager';

const API_COOLDOWN = 60000; // 1 minute in milliseconds
let lastApiCallTime = 0;

async function callApi(url: string, options: RequestInit = {}) {
  const now = Date.now();
  if (now - lastApiCallTime < API_COOLDOWN) {
    console.log('API call rate limit exceeded. Waiting...');
    await new Promise(resolve => setTimeout(resolve, API_COOLDOWN - (now - lastApiCallTime)));
  }

  const apiKey = getApiKey('debank');
  if (!apiKey) {
    console.error('DeBank API key not found. Please check your .env file.');
    throw new Error('DeBank API key not found. Please check your .env file.');
  }

  console.log(`Calling API: ${url}`);
  console.log(`API Key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'AccessKey': apiKey,
    },
  });

  if (!response.ok) {
    console.error(`API call failed: ${response.status} ${response.statusText}`);
    throw new Error(`API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('API Response:', data);

  lastApiCallTime = now;
  return data;
}

export async function getWalletBalance(address: string): Promise<number> {
  console.log(`Fetching balance for address: ${address}`);
  const url = `https://pro-openapi.debank.com/v1/user/total_balance?id=${address}`;
  try {
    const data = await callApi(url);
    console.log(`Balance for ${address}:`, data.total_usd_value);
    return data.total_usd_value;
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error);
    return 0;
  }
}

// Add other API functions here as needed
