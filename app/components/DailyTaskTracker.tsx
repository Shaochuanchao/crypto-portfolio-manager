'use client'

import { useState, useEffect } from 'react'
import { Project, Task } from '../data/model'
import { projectStorageIndexedDB, taskStorageIndexedDB } from '../utils/storage-db'
import SubTaskManager from './SubTaskManager'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'

export default function TaskManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<'daily' | 'oneTime'>('daily')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showSubTasks, setShowSubTasks] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const [newTask, setNewTask] = useState<Task>({
    id: '',
    name: '',
    projectId: '',
    startDate: '',
    endDate: '',
    guideLink: '',
    description: '',
    isDaily: true,
    subTaskCount: 0,
    isDeleted: false
  })

  useEffect(() => {
    const loadData = async () => {
      setProjects(await projectStorageIndexedDB.getProjects())
      setTasks(await taskStorageIndexedDB.getTasks())
    }
    loadData()
  }, [])

  const addTask = async () => {
    if (newTask.name && newTask.projectId) {
      const taskToAdd = { ...newTask, id: Date.now().toString() }
      const updatedTasks = [...tasks, taskToAdd]
      setTasks(updatedTasks)
      await taskStorageIndexedDB.saveTasks(updatedTasks)
      setShowAddTask(false)
      setNewTask({
        id: '',
        name: '',
        projectId: '',
        startDate: '',
        endDate: '',
        guideLink: '',
        description: '',
        isDaily: activeTab === 'daily',
        subTaskCount: 0,
        isDeleted: false
      })
    } else {
      alert('任务名称和关联项目不能为空！')
    }
  }

  const editTask = (task: Task) => {
    setNewTask(task)
    setShowAddTask(true)
  }

  const updateTask = async () => {
    if (newTask.name && newTask.projectId) {
      const updatedTasks = tasks.map(t => t.id === newTask.id ? newTask : t)
      setTasks(updatedTasks)
      await taskStorageIndexedDB.saveTasks(updatedTasks)
      setShowAddTask(false)
      setNewTask({
        id: '',
        name: '',
        projectId: '',
        startDate: '',
        endDate: '',
        guideLink: '',
        description: '',
        isDaily: activeTab === 'daily',
        subTaskCount: 0,
        isDeleted: false
      })
    } else {
      alert('任务名称和关联项目不能为空！')
    }
  }

  const deleteTask = async (taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, isDeleted: true } : t)
      setTasks(updatedTasks)
      await taskStorageIndexedDB.saveTasks(updatedTasks)
    }
  }

  const openSubTasks = (task: Task) => {
    setSelectedTask(task)
    setShowSubTasks(true)
  }

  const filteredTasks = tasks.filter(task => !task.isDeleted && task.isDaily === (activeTab === 'daily'))

  return (
    <div className="bg-yellow-100 rounded-lg p-6 shadow-lg relative">
      <h2 className="text-2xl font-bold mb-4 text-yellow-800">任务管理</h2>
      
      <div className="mb-4">
        <button
          onClick={() => setActiveTab('daily')}
          className={`mr-2 px-4 py-2 rounded ${activeTab === 'daily' ? 'bg-yellow-500 text-yellow-900' : 'bg-yellow-200 text-yellow-700'}`}
        >
          每日任务
        </button>
        <button
          onClick={() => setActiveTab('oneTime')}
          className={`px-4 py-2 rounded ${activeTab === 'oneTime' ? 'bg-yellow-500 text-yellow-900' : 'bg-yellow-200 text-yellow-700'}`}
        >
          一次性任务
        </button>
      </div>

      {/* 添加任务按钮 */}
      <div className="absolute top-6 right-6">
        <button 
          onClick={() => setShowAddTask(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold p-2 rounded-full"
        >
          <PlusCircle size={24} />
        </button>
      </div>

      <div className="bg-yellow-50 rounded-md p-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="mb-4 p-4 bg-yellow-200 rounded-md relative">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-yellow-800">{task.name}</h3>
                <p className="text-yellow-700">项目: {projects.find(p => p.id === task.projectId)?.name}</p>
                <p className="text-yellow-700">开始时间: {task.startDate}</p>
                <p className="text-yellow-700">结束时间: {task.endDate}</p>
                <p className="text-yellow-700">说明: {task.description}</p>
                <a href={task.guideLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                  {task.guideLink}
                </a>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => editTask(task)} className="text-yellow-600 hover:text-yellow-800 p-1">
                  <Edit size={24} />
                </button>
                <button onClick={() => deleteTask(task.id)} className="text-yellow-600 hover:text-yellow-800 p-1">
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
            <div className="absolute bottom-2 right-2">
              <button
                onClick={() => openSubTasks(task)}
                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-800 font-bold py-1 px-2 rounded"
              >
                子任务 ({task.subTaskCount})
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 添加/编辑任务模态框 */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-yellow-100 p-6 rounded-lg w-3/4 max-w-4xl my-8">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">{newTask.id ? '编辑任务' : '添加任务'}</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-yellow-700 text-sm font-bold mb-2" htmlFor="task-name">
                  任务名称
                </label>
                <input
                  id="task-name"
                  type="text"
                  placeholder="任务名称"
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                  className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
                />
              </div>
              <div>
                <label className="block text-yellow-700 text-sm font-bold mb-2" htmlFor="task-project">
                  关联项目
                </label>
                <select
                  id="task-project"
                  value={newTask.projectId}
                  onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                  className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 border border-yellow-300"
                >
                  <option value="">选择项目</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2" htmlFor="task-start-date">
                    开始时间
                  </label>
                  <input
                    id="task-start-date"
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                    className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 border border-yellow-300"
                  />
                </div>
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2" htmlFor="task-end-date">
                    结束时间
                  </label>
                  <input
                    id="task-end-date"
                    type="date"
                    value={newTask.endDate}
                    onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
                    className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 border border-yellow-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-yellow-700 text-sm font-bold mb-2" htmlFor="task-guide-link">
                  任务攻略链接
                </label>
                <input
                  id="task-guide-link"
                  type="text"
                  placeholder="任务攻略链接"
                  value={newTask.guideLink}
                  onChange={(e) => setNewTask({...newTask, guideLink: e.target.value})}
                  className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
                />
              </div>
              <div>
                <label className="block text-yellow-700 text-sm font-bold mb-2" htmlFor="task-description">
                  任务说明
                </label>
                <textarea
                  id="task-description"
                  placeholder="任务说明"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300 h-20"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="task-is-daily"
                  type="checkbox"
                  checked={newTask.isDaily}
                  onChange={(e) => setNewTask({...newTask, isDaily: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="task-is-daily" className="text-yellow-800">每日任务</label>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowAddTask(false)} className="mr-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-800 font-bold py-2 px-4 rounded">
                取消
              </button>
              <button onClick={newTask.id ? updateTask : addTask} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
                {newTask.id ? '更新' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubTasks && selectedTask && (
        <SubTaskManager
          task={selectedTask}
          onClose={() => setShowSubTasks(false)}
          onUpdateSubTaskCount={(count) => {
            const updatedTasks = tasks.map(t => 
              t.id === selectedTask.id ? {...t, subTaskCount: count} : t
            )
            setTasks(updatedTasks)
            taskStorageIndexedDB.saveTasks(updatedTasks)
          }}
        />
      )}
    </div>
  )
}
