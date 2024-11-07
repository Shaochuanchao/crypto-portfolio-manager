import { walletStorageIndexedDB, projectStorageIndexedDB, taskStorageIndexedDB, subTaskStorageIndexedDB, noteStorageIndexedDB } from './storage-db'

interface ExportData {
  wallets: any[]
  walletTypes: string[]
  projects: any[]
  tasks: any[]
  subTasks: any[]
  notes: any[]
  version: string
  exportDate: string
}

// 导出数据
export async function exportData() {
  try {
    const data: ExportData = {
      wallets: await walletStorageIndexedDB.getWallets(),
      walletTypes: await walletStorageIndexedDB.getWalletTypes(),
      projects: await projectStorageIndexedDB.getProjects(),
      tasks: await taskStorageIndexedDB.getTasks(),
      subTasks: [], // 将在下面填充
      notes: await noteStorageIndexedDB.getNotes(),
      version: '1.0',
      exportDate: new Date().toISOString()
    }

    // 获取所有任务的子任务
    for (const task of data.tasks) {
      const taskSubTasks = await subTaskStorageIndexedDB.getSubTasks(task.id)
      data.subTasks.push(...taskSubTasks)
    }

    // 创建并下载文件
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crypto-portfolio-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('数据导出成功')
  } catch (error) {
    console.error('导出数据失败:', error)
    throw error
  }
}

// 导入数据
export async function importData(file: File) {
  try {
    const text = await file.text()
    const data: ExportData = JSON.parse(text)

    // 验证数据格式
    if (!data.version || !data.exportDate) {
      throw new Error('无效的数据格式')
    }

    // 清除现有数据
    const db = await getDB()
    const tx = db.transaction(['wallets', 'walletTypes', 'projects', 'tasks', 'subTasks', 'notes'], 'readwrite')
    await Promise.all([
      tx.objectStore('wallets').clear(),
      tx.objectStore('walletTypes').clear(),
      tx.objectStore('projects').clear(),
      tx.objectStore('tasks').clear(),
      tx.objectStore('subTasks').clear(),
      tx.objectStore('notes').clear(),
      tx.done
    ])

    // 导入新数据
    await Promise.all([
      walletStorageIndexedDB.saveWallets(data.wallets),
      walletStorageIndexedDB.saveWalletTypes(data.walletTypes),
      projectStorageIndexedDB.saveProjects(data.projects),
      taskStorageIndexedDB.saveTasks(data.tasks),
      ...data.subTasks.map((subTask: any) => subTaskStorageIndexedDB.saveSubTask(subTask)),
      ...data.notes.map((note: any) => noteStorageIndexedDB.saveNote(note))
    ])

    console.log('数据导入成功')
  } catch (error) {
    console.error('导入数据失败:', error)
    throw error
  }
} 