export function getApiKey(service: string): string | null {
  if (service === 'debank') {
    return process.env.NEXT_PUBLIC_DEBANK_API_KEY || null;
  }
  return null;
}

// 移除 setApiKey 和 removeApiKey 函数，因为我们现在直接从环境变量读取
