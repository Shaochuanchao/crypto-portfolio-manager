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
    isDeleted: boolean;
    createdAt: string;
    updatedAt?: string;
    priority: number;
    priorityNote: string;
}

export interface SubTask {
    id: string
    taskId: string
    name: string
    description: string
    guideLink: string
}

export interface Chain {
  name: string;
  logoUrl: string;
  shortName: string;
  chainIndex: string;
  lastUpdated?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  priority: number; // 1-5 表示优先级
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;  // 添加颜色属性
  createdAt: string;
}
