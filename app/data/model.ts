export interface Wallet {
  address: string;
  type: string;
  twitter?: string;
  email?: string;
  alias?: string;  // 新增别名字段
}

export interface Project {
  id: string;
  name: string;
  description: string;
  website: string;
  discord: string;
  telegram: string;
  twitter: string;
  isMandatory: boolean;
  tags: string[];
  stage: string;
  airdropStage: string;
  estimatedPrice: string;
  endDate: string;
  relatedWallets: string[];
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
    id: string;
    name: string;
    projectId: string;
    startDate: string;
    endDate: string;
    guideLink: string;
    description: string;
    isDaily: boolean;
    subTaskCount: number;
    isDeleted: boolean;
    createdAt: string;
    priority: number; // 1-5，5 表示最高优先级
    priorityNote: string; // 优先级备注
}

export interface SubTask {
    id: string
    taskId: string
    name: string
    description: string
    guideLink: string
}
