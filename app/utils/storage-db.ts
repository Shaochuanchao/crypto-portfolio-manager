import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Wallet, Project, Task, SubTask, Chain, Note, Tag } from '../data/model';

interface MyDB extends DBSchema {
  wallets: {
    key: string;
    value: Wallet;
  };
  walletTypes: {
    key: string;
    value: string[];
  };
  projects: {
    key: string;
    value: Project;
  };
  tasks: {
    key: string;
    value: Task;
  };
  subTasks: {
    key: string;
    value: SubTask;
    indexes: { 'by-taskId': string };
  };
  chains: {
    key: string;
    value: Chain;
  };
  notes: {
    key: string;
    value: Note;
  };
  tags: {
    key: string;
    value: Tag;
  };
}

const DB_NAME = 'MyAppDatabase';
const DB_VERSION = 3;

async function getDB(): Promise<IDBPDatabase<MyDB>> {
  return openDB<MyDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (db.objectStoreNames.contains('subTasks')) {
        db.deleteObjectStore('subTasks');
      }

      if (oldVersion < 1) {
        db.createObjectStore('wallets', { keyPath: 'address' });
        db.createObjectStore('walletTypes');
        db.createObjectStore('projects', { keyPath: 'id' });
        db.createObjectStore('tasks', { keyPath: 'id' });
        db.createObjectStore('chains', { keyPath: 'chainIndex' });
      }

      const subTaskStore = db.createObjectStore('subTasks', { keyPath: 'id' });
      subTaskStore.createIndex('by-taskId', 'taskId');

      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
      }

      if (!db.objectStoreNames.contains('tags')) {
        db.createObjectStore('tags', { keyPath: 'id' });
      }
    },
  });
}

async function saveData<T extends Wallet[] | string[] | Project[] | Task[] | SubTask[]>(
  storeName: 'wallets' | 'walletTypes' | 'projects' | 'tasks' | 'subTasks',
  key: string,
  data: T
): Promise<void> {
  const db = await getDB();
  await db.put(storeName, data, key);
}

async function getData<T>(storeName: 'wallets' | 'walletTypes' | 'projects' | 'tasks' | 'subTasks', key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  const data = await db.get(storeName, key);
  return (data as T) ?? defaultValue;
}

// 将 generateUniqueId 改为导出函数
export function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// 钱包相关操作
export const walletStorageIndexedDB = {
  getWallets: async (): Promise<Wallet[]> => {
    const db = await getDB();
    const wallets = await db.getAll('wallets');
    console.log('Retrieved wallets:', wallets);
    return wallets;
  },

  saveWallets: async (wallets: Wallet[]): Promise<void> => {
    console.log('Saving wallets:', wallets);
    const db = await getDB();
    const tx = db.transaction('wallets', 'readwrite');
    const store = tx.objectStore('wallets');

    for (const wallet of wallets) {
      await store.put(wallet);
    }

    await tx.done;
    console.log('Finished saving wallets');
  },

  saveWallet: async (wallet: Wallet): Promise<void> => {
    console.log('Saving single wallet:', wallet);
    const db = await getDB();
    await db.put('wallets', wallet);
  },

  deleteWallet: async (address: string): Promise<void> => {
    console.log(`Deleting wallet with address: ${address}`);
    const db = await getDB();
    await db.delete('wallets', address);
  },

  getWalletTypes: async (): Promise<string[]> => getData('walletTypes', 'types', ['EVM', 'StarkNet']),
  saveWalletTypes: async (types: string[]): Promise<void> => saveData('walletTypes', 'types', types),
};

// 项目相关操作
export const projectStorageIndexedDB = {
  async getProjects(): Promise<Project[]> {
    const db = await getDB();
    const projects = await db.getAll('projects');
    console.log('Retrieved projects:', projects);
    return projects.filter(project => !project.isDeleted);
  },

  async saveProjects(projects: Project[]): Promise<void> {
    console.log('Saving projects:', projects);
    const db = await getDB();
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');

    for (const project of projects) {
      if (!project.id) {
        project.id = generateUniqueId();
        console.log('Generated ID for project:', project.id);
      }
      project.updatedAt = new Date().toISOString();
      await store.put(project);
    }

    await tx.done;
    console.log('Finished saving projects');
  },

  async saveProject(project: Project): Promise<void> {
    console.log('Saving single project:', project);
    if (!project.id) {
      project.id = generateUniqueId();
      console.log('Generated ID:', project.id);
    }
    project.updatedAt = new Date().toISOString();
    const db = await getDB();
    await db.put('projects', project);
  },

  async deleteProject(id: string): Promise<void> {
    console.log(`Deleting project with ID: ${id}`);
    const db = await getDB();
    const project = await db.get('projects', id);
    if (project) {
      project.isDeleted = true;
      project.updatedAt = new Date().toISOString();
      await db.put('projects', project);
      console.log('Marked project as deleted');
    }
  },
};

// 任务相关操作
export const taskStorageIndexedDB = {
  async getTasks(): Promise<Task[]> {
    const db = await getDB();
    const tasks = await db.getAll('tasks');
    console.log('Retrieved tasks:', tasks);
    return tasks.filter(task => !task.isDeleted);
  },

  async saveTasks(tasks: Task[]): Promise<void> {
    console.log('Saving tasks:', tasks);
    const db = await getDB();
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');

    for (const task of tasks) {
      if (!task.id) {
        task.id = generateUniqueId();
        console.log('Generated ID for task:', task.id);
      }
      task.updatedAt = new Date().toISOString();
      await store.put(task);
    }

    await tx.done;
    console.log('Finished saving tasks');
  },

  async saveTask(task: Task): Promise<void> {
    console.log('Saving single task:', task);
    if (!task.id) {
      task.id = generateUniqueId();
      console.log('Generated ID:', task.id);
    }
    task.updatedAt = new Date().toISOString();
    const db = await getDB();
    await db.put('tasks', task);
  },

  async deleteTask(id: string): Promise<void> {
    console.log(`Deleting task with ID: ${id}`);
    const db = await getDB();
    const task = await db.get('tasks', id);
    if (task) {
      task.isDeleted = true;
      task.updatedAt = new Date().toISOString();
      await db.put('tasks', task);
      console.log('Marked task as deleted');
    }
  },
};

// 子任务相关操作
export const subTaskStorageIndexedDB = {
  async getSubTasks(taskId: string): Promise<SubTask[]> {
    const db = await getDB();
    try {
      console.log('Getting subtasks for taskId:', taskId);
      const subTasks = await db.getAllFromIndex('subTasks', 'by-taskId', taskId);
      console.log('Retrieved subtasks:', subTasks);
      return subTasks || [];
    } catch (error) {
      console.error('Error getting subtasks:', error);
      return [];
    }
  },

  async saveSubTask(subTask: SubTask): Promise<void> {
    console.log('Saving subtask:', subTask);
    if (!subTask.id) {
      subTask.id = generateUniqueId();
    }
    const db = await getDB();
    try {
      if (!subTask.taskId) {
        throw new Error('SubTask must have a taskId');
      }
      await db.put('subTasks', subTask);
      console.log('Successfully saved subtask:', subTask);
      
      const savedSubTask = await db.get('subTasks', subTask.id);
      console.log('Verified saved subtask:', savedSubTask);
    } catch (error) {
      console.error('Error saving subtask:', error);
      throw error;
    }
  },

  async deleteSubTask(id: string): Promise<void> {
    console.log('Deleting subtask:', id);
    const db = await getDB();
    try {
      await db.delete('subTasks', id);
      console.log('Successfully deleted subtask:', id);
    } catch (error) {
      console.error('Error deleting subtask:', error);
      throw error;
    }
  },

  async deleteAllSubTasks(taskId: string): Promise<void> {
    console.log('Deleting all subtasks for task:', taskId);
    const db = await getDB();
    try {
      const subTasks = await db.getAllFromIndex('subTasks', 'by-taskId', taskId);
      console.log('Found subtasks to delete:', subTasks);
      const tx = db.transaction('subTasks', 'readwrite');
      await Promise.all([
        ...subTasks.map(subTask => tx.store.delete(subTask.id)),
        tx.done
      ]);
      console.log('Successfully deleted all subtasks for task:', taskId);
    } catch (error) {
      console.error('Error deleting subtasks:', error);
      throw error;
    }
  }
};

export const chainStorageIndexedDB = {
  async getChains(): Promise<Chain[]> {
    const db = await getDB();
    return db.getAll('chains');
  },

  async saveChains(chains: Chain[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('chains', 'readwrite');
    await Promise.all([
      ...chains.map(chain => tx.store.put(chain)),
      tx.done
    ]);
  }
};

// 笔记相关操作
export const noteStorageIndexedDB = {
  async getNotes(): Promise<Note[]> {
    const db = await getDB();
    const notes = await db.getAll('notes');
    console.log('Retrieved notes:', notes);
    return notes.filter(note => !note.isDeleted);
  },

  async saveNote(note: Note): Promise<void> {
    console.log('Saving note:', note);
    if (!note.id) {
      note.id = generateUniqueId();
      note.createdAt = new Date().toISOString();
    }
    note.updatedAt = new Date().toISOString();
    const db = await getDB();
    await db.put('notes', note);
  },

  async deleteNote(id: string): Promise<void> {
    console.log(`Deleting note with ID: ${id}`);
    const db = await getDB();
    const note = await db.get('notes', id);
    if (note) {
      note.isDeleted = true;
      note.updatedAt = new Date().toISOString();
      await db.put('notes', note);
    }
  }
};

// 标签相关操作
export const tagStorageIndexedDB = {
  async getTags(): Promise<Tag[]> {
    const db = await getDB();
    const tags = await db.getAll('tags');
    return tags;
  },

  async saveTag(tag: Tag): Promise<void> {
    if (!tag.id) {
      tag.id = generateUniqueId();
    }
    const db = await getDB();
    await db.put('tags', tag);
  },

  async deleteTag(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('tags', id);
  }
};
