'use client'

import { useState, useEffect } from 'react'
import { Project, Task, SubTask } from '../data/model'
import { projectStorageIndexedDB, taskStorageIndexedDB, subTaskStorageIndexedDB } from '../utils/storage-db'
import { PlusCircle, Edit, Trash2, List, Plus } from 'lucide-react'

export default function TaskManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<'daily' | 'oneTime'>('daily')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showSubTasks, setShowSubTasks] = useState(false)
  const [showAddSubTask, setShowAddSubTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showProjectDetails, setShowProjectDetails] = useState(false)
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  const [newSubTask, setNewSubTask] = useState<SubTask>({
    id: '',
    taskId: '',
    name: '',
    description: '',
    guideLink: ''
  })

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

  const [editingSubTask, setEditingSubTask] = useState<SubTask | null>(null)
  const [showEditSubTask, setShowEditSubTask] = useState(false)

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

  const openSubTasks = async (task: Task) => {
    setSelectedTask(task)
    const loadedSubTasks = await subTaskStorageIndexedDB.getSubTasks(task.id)
    setSubTasks(loadedSubTasks)
    setShowSubTasks(true)
  }

  const openAddSubTask = (task: Task) => {
    setSelectedTask(task)
    setNewSubTask({
      id: '',
      taskId: task.id,
      name: '',
      description: '',
      guideLink: ''
    })
    setShowAddSubTask(true)
  }

  const openProjectDetails = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setSelectedProject(project)
      setShowProjectDetails(true)
    }
  }

  const filteredTasks = tasks.filter(task => !task.isDeleted && task.isDaily === (activeTab === 'daily'))

  const addSubTask = async () => {
    if (newSubTask.name && selectedTask) {
      const subTaskToAdd = { ...newSubTask, id: Date.now().toString(), taskId: selectedTask.id }
      await subTaskStorageIndexedDB.saveSubTask(subTaskToAdd)
      const updatedSubTasks = await subTaskStorageIndexedDB.getSubTasks(selectedTask.id)
      setSubTasks(updatedSubTasks)
      setShowAddSubTask(false)
      
      // Update the subTaskCount of the parent task
      const updatedTask = { ...selectedTask, subTaskCount: updatedSubTasks.length }
      const updatedTasks = tasks.map(t => t.id === selectedTask.id ? updatedTask : t)
      setTasks(updatedTasks)
      await taskStorageIndexedDB.saveTask(updatedTask)
    }
  }

  const editSubTask = (subTask: SubTask) => {
    setEditingSubTask(subTask)
    setShowEditSubTask(true)
  }

  const updateSubTask = async () => {
    if (editingSubTask && selectedTask) {
      await subTaskStorageIndexedDB.saveSubTask(editingSubTask)
      const updatedSubTasks = await subTaskStorageIndexedDB.getSubTasks(selectedTask.id)
      setSubTasks(updatedSubTasks)
      setShowEditSubTask(false)
      setEditingSubTask(null)
    }
  }

  const deleteSubTask = async (subTaskId: string) => {
    if (selectedTask && confirm('确定要删除这个子任务吗？')) {
      await subTaskStorageIndexedDB.deleteSubTask(subTaskId)
      const updatedSubTasks = await subTaskStorageIndexedDB.getSubTasks(selectedTask.id)
      setSubTasks(updatedSubTasks)

      // 更新父任务的子任务计数
      const updatedTask = { ...selectedTask, subTaskCount: updatedSubTasks.length }
      const updatedTasks = tasks.map(t => t.id === selectedTask.id ? updatedTask : t)
      setTasks(updatedTasks)
      await taskStorageIndexedDB.saveTask(updatedTask)
    }
  }

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
                <p className="text-yellow-700">
                  项目: 
                  <button 
                    onClick={() => openProjectDetails(task.projectId)}
                    className="text-blue-500 hover:text-blue-700 underline ml-1"
                  >
                    {projects.find(p => p.id === task.projectId)?.name}
                  </button>
                </p>
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
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <button
                onClick={() => openSubTasks(task)}
                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-800 font-bold py-1 px-2 rounded flex items-center"
              >
                <List size={16} className="mr-1" />
                子任务 ({task.subTaskCount})
              </button>
              <button
                onClick={() => openAddSubTask(task)}
                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-800 font-bold py-1 px-2 rounded flex items-center"
              >
                <Plus size={16} className="mr-1" />
                添加子任务
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

      {/* 子任务列表模态框 */}
      {showSubTasks && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-yellow-100 p-6 rounded-lg w-3/4 max-w-4xl my-8">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">子任务列表 - {selectedTask.name}</h3>
            <div className="space-y-4">
              {subTasks.map((subTask) => (
                <div key={subTask.id} className="bg-yellow-200 p-4 rounded-md flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">{subTask.name}</h4>
                    <p>{subTask.description}</p>
                    {subTask.guideLink && (
                      <a href={subTask.guideLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                        任务攻略
                      </a>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => editSubTask(subTask)} className="text-yellow-600 hover:text-yellow-800 p-1">
                      <Edit size={20} />
                    </button>
                    <button onClick={() => deleteSubTask(subTask.id)} className="text-yellow-600 hover:text-yellow-800 p-1">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowSubTasks(false)} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加子任务模态框 */}
      {showAddSubTask && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-yellow-100 p-6 rounded-lg w-3/4 max-w-4xl my-8">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">添加子任务 - {selectedTask.name}</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="子任务名称"
                value={newSubTask.name}
                onChange={(e) => setNewSubTask({...newSubTask, name: e.target.value})}
                className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
              />
              <textarea
                placeholder="子任务描述"
                value={newSubTask.description}
                onChange={(e) => setNewSubTask({...newSubTask, description: e.target.value})}
                className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300 h-20"
              />
              <input
                type="text"
                placeholder="任务攻略链接"
                value={newSubTask.guideLink}
                onChange={(e) => setNewSubTask({...newSubTask, guideLink: e.target.value})}
                className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowAddSubTask(false)} className="mr-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-800 font-bold py-2 px-4 rounded">
                取消
              </button>
              <button onClick={addSubTask} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 项目详情模态框 */}
      {showProjectDetails && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-yellow-100 p-6 rounded-lg w-3/4 max-w-4xl my-8">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">项目详情</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-yellow-700 text-sm font-bold mb-2">项目名称</label>
                <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.name}</p>
              </div>
              <div>
                <label className="block text-yellow-700 text-sm font-bold mb-2">项目简介</label>
                <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">Discord链接</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.discord}</p>
                </div>
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">官网地址</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.website}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">Telegram链接</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.telegram}</p>
                </div>
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">Twitter链接</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.twitter}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">所处阶段</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.stage}</p>
                </div>
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">空投阶段</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.airdropStage}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">预计币价格</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">${selectedProject.estimatedPrice}</p>
                </div>
                <div>
                  <label className="block text-yellow-700 text-sm font-bold mb-2">结束时间节点</label>
                  <p className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800">{selectedProject.endDate}</p>
                </div>
              </div>
              <div>
                <label className="block text-yellow-700 text-sm font-bold mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 rounded-full text-sm bg-yellow-300 text-yellow-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <label className="block text-yellow-700 text-sm font-bold mr-2">是否为必做项目</label>
                <p className="text-yellow-800">{selectedProject.isMandatory ? '是' : '否'}</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowProjectDetails(false)} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑子任务模态框 */}
      {showEditSubTask && editingSubTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-yellow-100 p-6 rounded-lg w-3/4 max-w-4xl my-8">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">编辑子任务</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="子任务名称"
                value={editingSubTask.name}
                onChange={(e) => setEditingSubTask({...editingSubTask, name: e.target.value})}
                className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
              />
              <textarea
                placeholder="子任务描述"
                value={editingSubTask.description}
                onChange={(e) => setEditingSubTask({...editingSubTask, description: e.target.value})}
                className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300 h-20"
              />
              <input
                type="text"
                placeholder="任务攻略链接"
                value={editingSubTask.guideLink}
                onChange={(e) => setEditingSubTask({...editingSubTask, guideLink: e.target.value})}
                className="w-full p-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowEditSubTask(false)} className="mr-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-800 font-bold py-2 px-4 rounded">
                取消
              </button>
              <button onClick={updateSubTask} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
                更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}