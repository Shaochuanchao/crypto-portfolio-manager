'use client'

import { useState, useEffect } from 'react'
import { Project, Task, SubTask } from '../data/model'
import { projectStorageIndexedDB, taskStorageIndexedDB, subTaskStorageIndexedDB } from '../utils/storage-db'
import { PlusCircle, Edit, Trash2, List, Plus, CheckSquare, Star, ChevronLeft, ChevronRight, Search, ExternalLink, X, Edit2 } from 'lucide-react'
import { truncateString, generateUniqueId } from '../utils/helpers'; // 假设我们在 utils 文件夹中创建了这个辅助函数
import TaskCard from './TaskCard'

export default function TaskManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'oneTime' | 'useless'>('all')
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
    isDeleted: false,
    createdAt: '',
    priority: 5, // 默认最高优先级
    priorityNote: '',
  })

  const [editingSubTask, setEditingSubTask] = useState<SubTask | null>(null)
  const [showEditSubTask, setShowEditSubTask] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: string }>({})
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1)
  const tasksPerPage = 10

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [subTaskCounts, setSubTaskCounts] = useState<{ [taskId: string]: number }>({})

  // 加载子任务数量
  const loadSubTaskCounts = async (tasks: Task[]) => {
    const counts: { [taskId: string]: number } = {}
    for (const task of tasks) {
      const subTasks = await subTaskStorageIndexedDB.getSubTasks(task.id)
      counts[task.id] = subTasks.length
    }
    setSubTaskCounts(counts)
  }

  useEffect(() => {
    const loadData = async () => {
      setProjects(await projectStorageIndexedDB.getProjects())
      const loadedTasks = await taskStorageIndexedDB.getTasks()
      setTasks(loadedTasks)
      await loadSubTaskCounts(loadedTasks)
      
      // 加载已完成任务
      const storedCompletedTasks = localStorage.getItem('completedTasks')
      if (storedCompletedTasks) {
        const parsedCompletedTasks = JSON.parse(storedCompletedTasks)
        // 检查并重置过期的每日任务
        const today = new Date().toISOString().split('T')[0]
        const updatedCompletedTasks = Object.fromEntries(
          Object.entries(parsedCompletedTasks).filter(([taskId, date]) => {
            const task = loadedTasks.find(t => t.id === taskId)
            return task && (!task.isDaily || date === today)
          })
        )
        setCompletedTasks(updatedCompletedTasks)
        localStorage.setItem('completedTasks', JSON.stringify(updatedCompletedTasks))
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const resetDailyTasks = () => {
      const today = new Date().toISOString().split('T')[0]
      const updatedCompletedTasks = { ...completedTasks }
      let hasChanges = false
      Object.keys(updatedCompletedTasks).forEach(taskId => {
        const task = tasks.find(t => t.id === taskId)
        if (task && task.isDaily && updatedCompletedTasks[taskId] !== today) {
          delete updatedCompletedTasks[taskId]
          hasChanges = true
        }
      })
      if (hasChanges) {
        setCompletedTasks(updatedCompletedTasks)
        localStorage.setItem('completedTasks', JSON.stringify(updatedCompletedTasks))
      }
    }

    // 立即执行一次重置
    resetDailyTasks()

    // 设置每天凌晨重置的定时器
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timeToMidnight = tomorrow.getTime() - now.getTime()

    const timer = setTimeout(() => {
      resetDailyTasks()
      // 设置每24小时重复执行
      setInterval(resetDailyTasks, 24 * 60 * 60 * 1000)
    }, timeToMidnight)

    return () => {
      clearTimeout(timer)
    }
  }, [completedTasks, tasks])

  const addTask = async () => {
    if (newTask.name && newTask.projectId) {
      const taskToAdd = { ...newTask, id: Date.now().toString(), createdAt: new Date().toISOString() }
      await taskStorageIndexedDB.saveTask(taskToAdd)
      const updatedTasks = await taskStorageIndexedDB.getTasks()
      setTasks(updatedTasks)
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
        isDeleted: false,
        createdAt: new Date().toISOString(),
        priority: 5,
        priorityNote: '',
      })
    } else {
      alert('任务名称和关联项目不能为空！')
    }
  }

  const editTask = (task: Task) => {
    setEditingTask(task);
    setNewTask(task);
    setShowAddTask(true);
  };

  const updateTask = async () => {
    if (editingTask && newTask.name.trim()) {
      const updatedTask = {
        ...editingTask,
        ...newTask,
        updatedAt: new Date().toISOString()
      };
      await taskStorageIndexedDB.saveTask(updatedTask);
      const updatedTasks = await taskStorageIndexedDB.getTasks();
      setTasks(updatedTasks);
      setShowAddTask(false);
      setEditingTask(null);
      resetNewTask();
    }
  };

  const deleteTask = async (taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      try {
        // 先删除所有子任务
        await subTaskStorageIndexedDB.deleteAllSubTasks(taskId);
        // 再删除任务
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, isDeleted: true } : t);
        setTasks(updatedTasks);
        await taskStorageIndexedDB.saveTasks(updatedTasks);
      } catch (error) {
        console.error('Error deleting task and subtasks:', error);
      }
    }
  };

  const openSubTasks = async (task: Task) => {
    console.log('Opening subtasks for task:', task);
    setSelectedTask(task);
    try {
      const loadedSubTasks = await subTaskStorageIndexedDB.getSubTasks(task.id);
      console.log('Loaded subtasks:', loadedSubTasks);
      setSubTasks(loadedSubTasks);
      setSubTaskCounts(prev => ({
        ...prev,
        [task.id]: loadedSubTasks.length
      }));
      setShowSubTasks(true);
    } catch (error) {
      console.error('Error loading subtasks:', error);
      setSubTasks([]);
    }
  };

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

  const filteredTasks = tasks.filter(task => 
    !task.isDeleted && 
    (activeTab === 'all' ||
     (activeTab === 'daily' && task.isDaily) ||
     (activeTab === 'oneTime' && !task.isDaily && !task.isUseless) ||
     (activeTab === 'useless' && task.isUseless)) &&
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addSubTask = async () => {
    if (newSubTask.name && selectedTask) {
      const subTaskToAdd = {
        ...newSubTask,
        id: generateUniqueId(),
        taskId: selectedTask.id
      };

      try {
        await subTaskStorageIndexedDB.saveSubTask(subTaskToAdd);
        // 重新加载子任务列表
        const updatedSubTasks = await subTaskStorageIndexedDB.getSubTasks(selectedTask.id);
        setSubTasks(updatedSubTasks);
        
        // 重置表单
        setShowAddSubTask(false);
        setNewSubTask({
          id: '',
          taskId: selectedTask.id,
          name: '',
          description: '',
          guideLink: ''
        });
      } catch (error) {
        console.error('Error saving subtask:', error);
      }
    }
  };

  const editSubTask = (subTask: SubTask) => {
    setEditingSubTask(subTask)
    setShowEditSubTask(true)
  }

  const updateSubTask = async () => {
    if (editingSubTask && selectedTask) {
      try {
        await subTaskStorageIndexedDB.saveSubTask(newSubTask);
        // 重新加载子任务列表
        const updatedSubTasks = await subTaskStorageIndexedDB.getSubTasks(selectedTask.id);
        setSubTasks(updatedSubTasks);
        
        // 重置表单
        setShowAddSubTask(false);
        setEditingSubTask(null);
        setNewSubTask({
          id: '',
          taskId: selectedTask.id,
          name: '',
          description: '',
          guideLink: ''
        });
      } catch (error) {
        console.error('Error updating subtask:', error);
      }
    }
  };

  const deleteSubTask = async (subTaskId: string) => {
    if (selectedTask && confirm('确定要删除这个子任务吗？')) {
      try {
        await subTaskStorageIndexedDB.deleteSubTask(subTaskId);
        // 重新加载子任务列表
        const updatedSubTasks = await subTaskStorageIndexedDB.getSubTasks(selectedTask.id);
        setSubTasks(updatedSubTasks);
      } catch (error) {
        console.error('Error deleting subtask:', error);
      }
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    const today = new Date().toISOString().split('T')[0]
    setCompletedTasks(prev => {
      const updated = { ...prev }
      if (updated[taskId] === today) {
        delete updated[taskId]
      } else {
        updated[taskId] = today
      }
      localStorage.setItem('completedTasks', JSON.stringify(updated))
      return updated
    })
  }

  const isTaskCompleted = (taskId: string) => {
    const today = new Date().toISOString().split('T')[0]
    return completedTasks[taskId] === today
  }

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aCompleted = isTaskCompleted(a.id);
    const bCompleted = isTaskCompleted(b.id);

    // 首先按完成状态排序
    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }

    // 如果完成状态相同，则按优先级排序
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    // 如果优先级也相同，则按创建时间排序
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const renderPriorityStars = (priority: number = 5) => {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < priority ? 'text-yellow-500 fill-yellow-500' : 'text-yellow-200'}
      />
    ))
  }

  const indexOfLastTask = currentPage * tasksPerPage
  const indexOfFirstTask = indexOfLastTask - tasksPerPage
  const currentTasks = sortedTasks.slice(indexOfFirstTask, indexOfLastTask)

  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / tasksPerPage))

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const resetNewTask = () => {
    setNewTask({
      id: '',
      name: '',
      projectId: '',
      startDate: '',
      endDate: '',
      guideLink: '',
      description: '',
      isDaily: true,
      subTaskCount: 0,
      isDeleted: false,
      createdAt: '',
      priority: 5,
      priorityNote: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>

          {/* 任务类型切换 */}
          <div className="flex space-x-2">
            {['all', 'daily', 'oneTime', 'useless'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type as any)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === type
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? '所有任务' :
                 type === 'daily' ? '每日任务' :
                 type === 'oneTime' ? '一次性任务' : '鸡肋任务'}
              </button>
            ))}
          </div>
        </div>

        {/* 添加任务按钮 */}
        <button
          onClick={() => setShowAddTask(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          添加任务
        </button>
      </div>

      {/* 任务列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isCompleted={isTaskCompleted(task.id)}
            onEdit={editTask}
            onDelete={deleteTask}
            onToggleCompletion={toggleTaskCompletion}
            onShowSubTasks={openSubTasks}
            getProjectName={(projectId) => {
              const project = projects.find(p => p.id === projectId)
              return project ? project.name : '未关联项目'
            }}
            subTaskCount={subTaskCounts[task.id] || 0}
          />
        ))}
      </div>

      {/* 分页控件 - 统一风格 */}
      {sortedTasks.length > 0 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 disabled:opacity-50 disabled:hover:bg-primary-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-gray-700 font-medium">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 disabled:opacity-50 disabled:hover:bg-primary-100 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* 添加/编辑任务模态框 */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg w-3/4 max-w-4xl my-8 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {editingTask ? '编辑任务' : '新增任务'}
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {/* 基本信息 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务名称
                </label>
                <input
                  type="text"
                  placeholder="任务名称"
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              {/* 任务描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务描述
                </label>
                <textarea
                  placeholder="任务描述"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              {/* 关联项目和任务类型 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    关联项目
                  </label>
                  <select
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-primary-500
                      text-gray-900 bg-white"
                  >
                    <option value="">选择项目</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    任务类型
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={newTask.isDaily}
                        onChange={() => setNewTask({...newTask, isDaily: true})}
                        className="form-radio h-4 w-4 text-primary-600"
                      />
                      <span className="ml-2 text-gray-700">每日任务</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={!newTask.isDaily}
                        onChange={() => setNewTask({...newTask, isDaily: false})}
                        className="form-radio h-4 w-4 text-primary-600"
                      />
                      <span className="ml-2 text-gray-700">一次性任务</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 时间设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间
                  </label>
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-primary-500
                      text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间
                  </label>
                  <input
                    type="date"
                    value={newTask.endDate}
                    onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-primary-500
                      text-gray-900 bg-white"
                  />
                </div>
              </div>

              {/* 优先级设置 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  {[1, 2, 3, 4, 5].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setNewTask({...newTask, priority})}
                      className="focus:outline-none"
                    >
                      <Star
                        size={24}
                        className={`${
                          priority <= newTask.priority
                            ? 'text-primary-500 fill-primary-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="优先级备（可选）"
                  value={newTask.priorityNote}
                  onChange={(e) => setNewTask({...newTask, priorityNote: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              {/* 攻略链 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  攻略链接 (可选)
                </label>
                <input
                  type="text"
                  placeholder="攻略链接"
                  value={newTask.guideLink}
                  onChange={(e) => setNewTask({...newTask, guideLink: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowAddTask(false);
                  setEditingTask(null);
                  resetNewTask();
                }} 
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                消
              </button>
              <button 
                onClick={editingTask ? updateTask : addTask}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                {editingTask ? '更新' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 子任务列表模态框 */}
      {showSubTasks && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg w-3/4 max-w-4xl my-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                子任务管理 - {selectedTask.name}
              </h3>
              <button
                onClick={() => {
                  setShowSubTasks(false);
                  setSelectedTask(null);
                  setSubTasks([]); // 清空子任务列表
                }}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 子任务列表 */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {Array.isArray(subTasks) && subTasks.length > 0 ? (
                subTasks.map((subTask) => (
                  <div
                    key={subTask.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-primary-200 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-gray-900">
                          {subTask.name}
                        </h4>
                        {subTask.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {subTask.description}
                          </p>
                        )}
                        {subTask.guideLink && (
                          <a
                            href={subTask.guideLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                          >
                            <ExternalLink size={14} className="mr-1" />
                            查看攻略
                          </a>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingSubTask(subTask);
                            setNewSubTask(subTask);
                            setShowAddSubTask(true);
                          }}
                          className="text-gray-400 hover:text-primary-600 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteSubTask(subTask.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">暂无子任务</p>
              )}
            </div>

            {/* 添加子任务按钮 */}
            {!showAddSubTask && (
              <button
                onClick={() => setShowAddSubTask(true)}
                className="mt-4 flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                添加子任务
              </button>
            )}

            {/* 添加/编辑子任务表单 */}
            {showAddSubTask && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-base font-medium text-gray-900 mb-4">
                  {editingSubTask ? '编辑子任务' : '添加子任务'}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      子任务名称
                    </label>
                    <input
                      type="text"
                      value={newSubTask.name}
                      onChange={(e) => setNewSubTask({ ...newSubTask, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        text-gray-900 bg-white placeholder-gray-400"
                      placeholder="输入子任务名称"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      描述 (可选)
                    </label>
                    <textarea
                      value={newSubTask.description}
                      onChange={(e) => setNewSubTask({ ...newSubTask, description: e.target.value })}
                      className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        text-gray-900 bg-white placeholder-gray-400"
                      placeholder="输入子任务描述"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      攻略链接 (可选)
                    </label>
                    <input
                      type="text"
                      value={newSubTask.guideLink}
                      onChange={(e) => setNewSubTask({ ...newSubTask, guideLink: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-primary-500
                        text-gray-900 bg-white placeholder-gray-400"
                      placeholder="输入攻略链接"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowAddSubTask(false);
                        setEditingSubTask(null);
                        setNewSubTask({
                          id: '',
                          taskId: selectedTask.id,
                          name: '',
                          description: '',
                          guideLink: ''
                        });
                      }}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={editingSubTask ? updateSubTask : addSubTask}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      {editingSubTask ? '更新' : '添加'}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                placeholder="任务攻链接"
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
