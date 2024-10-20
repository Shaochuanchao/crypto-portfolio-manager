'use client'

import { useState, useEffect } from 'react'
import { Task, SubTask } from '../data/model'
import { subTaskStorageIndexedDB } from '../utils/storage-db'
import { truncateString } from '../utils/helpers'

interface SubTaskManagerProps {
  task: Task
  onClose: () => void
  onUpdateSubTaskCount: (count: number) => void
}

export default function SubTaskManager({ task, onClose, onUpdateSubTaskCount }: SubTaskManagerProps) {
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  const [newSubTask, setNewSubTask] = useState<SubTask>({
    id: '',
    taskId: task.id,
    name: '',
    description: '',
    guideLink: ''
  })

  useEffect(() => {
    const loadSubTasks = async () => {
      const loadedSubTasks = await subTaskStorageIndexedDB.getSubTasks(task.id)
      setSubTasks(loadedSubTasks)
    }
    loadSubTasks()
  }, [task.id])

  const addSubTask = async () => {
    if (newSubTask.name) {
      const subTaskToAdd = { ...newSubTask, id: Date.now().toString() }
      const updatedSubTasks = [...subTasks, subTaskToAdd]
      setSubTasks(updatedSubTasks)
      await subTaskStorageIndexedDB.saveSubTasks(task.id, updatedSubTasks)
      onUpdateSubTaskCount(updatedSubTasks.length)
      setNewSubTask({
        id: '',
        taskId: task.id,
        name: '',
        description: '',
        guideLink: ''
      })
    } else {
      alert('子任务名称不能为空！')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-yellow-100 p-6 rounded-lg w-3/4 max-w-4xl my-8">
        <h3 className="text-2xl font-bold mb-4 text-yellow-800">子任务 - {task.name}</h3>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="子任务名称"
            value={newSubTask.name}
            onChange={(e) => setNewSubTask({...newSubTask, name: e.target.value})}
            className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
          />
          <input
            type="text"
            placeholder="任务攻略链接"
            value={newSubTask.guideLink}
            onChange={(e) => setNewSubTask({...newSubTask, guideLink: e.target.value})}
            className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
          />
          <textarea
            placeholder="简要说明"
            value={newSubTask.description}
            onChange={(e) => setNewSubTask({...newSubTask, description: e.target.value})}
            className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
          />
          <button onClick={addSubTask} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
            添加子任务
          </button>
        </div>

        <div className="space-y-4">
          {subTasks.map((subTask) => (
            <div key={subTask.id} className="bg-yellow-200 p-4 rounded-md flex justify-between items-start">
              <div>
                <h4 className="font-bold">{subTask.name}</h4>
                <p>{subTask.description}</p>
                {subTask.guideLink && (
                  <a 
                    href={subTask.guideLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:text-blue-700"
                    title={subTask.guideLink}
                  >
                    {truncateString(subTask.guideLink, 30)}
                  </a>
                )}
              </div>
              {/* ... 编辑和删除按钮 */}
            </div>
          ))}
        </div>

        <button onClick={onClose} className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
          关闭
        </button>
      </div>
    </div>
  )
}
