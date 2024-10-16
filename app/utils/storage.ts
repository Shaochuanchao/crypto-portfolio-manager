// 定义数据类型
export interface Wallet {
  address: string;
  type: string;
  twitter?: string;
  email?: string;
}

export interface Project {
  name: string;
  description: string;
  website: string;
  discord: string;
  telegram: string;
  twitter: string;
  isMandatory: boolean;
  tags: string[]; // 添加 tags 字段
}

export interface DailyTask {
  date: string;
  project: string;
  completedWallets: string[];
}

// 存储键名
const WALLETS_KEY = 'wallets';
const WALLET_TYPES_KEY = 'walletTypes';
const PROJECTS_KEY = 'projects'; // 更改键名
const DAILY_TASKS_KEY = 'dailyTasks';

// 通用的存储和读取函数
function saveData<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function getData<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

// 钱包相关操作
export const walletStorage = {
  getWallets: (): Wallet[] => getData<Wallet[]>(WALLETS_KEY, []),
  saveWallets: (wallets: Wallet[]): void => saveData(WALLETS_KEY, wallets),
  getWalletTypes: (): string[] => getData<string[]>(WALLET_TYPES_KEY, ['EVM', 'StarkNet']),
  saveWalletTypes: (types: string[]): void => saveData(WALLET_TYPES_KEY, types),
};

// 项目相关操作
export const projectStorage = {
  getProjects: (): Project[] => getData<Project[]>(PROJECTS_KEY, []),
  saveProjects: (projects: Project[]): void => saveData(PROJECTS_KEY, projects),
};

// 每日任务相关操作
export const dailyTaskStorage = {
  getTasks: (): DailyTask[] => getData<DailyTask[]>(DAILY_TASKS_KEY, []),
  saveTasks: (tasks: DailyTask[]): void => saveData(DAILY_TASKS_KEY, tasks),
};
