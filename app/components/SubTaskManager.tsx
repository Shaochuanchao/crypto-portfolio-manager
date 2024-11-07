'use client'

import { useState } from 'react'
import { Task, SubTask } from '../data/model'
import { subTaskStorageIndexedDB } from '../utils/storage-db'
import { Edit2, Trash2, Plus, X, ExternalLink } from 'lucide-react'
import { generateUniqueId } from '../utils/helpers'

interface SubTaskManagerProps {
  task: Task
  subTasks: SubTask[]
  setSubTasks: (subTasks: SubTask[]) => void
  onClose: () => void
}

export default function SubTaskManager({
  task,
  subTasks,
  setSubTasks,
  onClose
}: SubTaskManagerProps) {
  const [showAddSubTask, setShowAddSubTask] = useState(false)
  const [editingSubTask, setEditingSubTask] = useState<SubTask | null>(null)
  const [newSubTask, setNewSubTask] = useState<SubTask>({
    id: '',
    taskId: task.id,
    name: '',
    description: '',
    guideLink: ''
  })

  const addSubTask = async () => {
    if (newSubTask.name) {
      try {
        const subTaskToAdd: SubTask = {
          ...newSubTask,
          id: generateUniqueId(),
          taskId: task.id
        };

        await subTaskStorageIndexedDB.saveSubTask(subTaskToAdd);
        
        const updatedSubTasks = await subTaskStorageIndexedDB.getSubTasks(task.id);
        console.log('Updated subtasks:', updatedSubTasks);
        setSubTasks(updatedSubTasks);
        
        setShowAddSubTask(false);
        setNewSubTask({
          id: '',
          taskId: task.id,
          name: '',
          description: '',
          guideLink: ''
        });
      } catch (error) {
        console.error('Error saving subtask:', error);
      }
    }
  }

  const updateSubTask = async () => {
    if (editingSubTask && newSubTask.name) {
      try {
        const updatedSubTask: SubTask = {
          ...newSubTask,
          id: editingSubTask.id,
          taskId: task.id
        };

        await subTaskStorageIndexedDB.saveSubTask(updatedSubTask);
        
        const updatedSubTasks = await subTaskStorageIndexedDB.getSubTasks(task.id);
        console.log('Updated subtasks after edit:', updatedSubTasks);
        setSubTasks(updatedSubTasks);
        
        setShowAddSubTask(false);
        setEditingSubTask(null);
        setNewSubTask({
          id: '',
          taskId: task.id,
          name: '',
          description: '',
          guideLink: ''
        });
      } catch (error) {
        console.error('Error updating subtask:', error);
      }
    }
  }

  const deleteSubTask = async (subTaskId: string) => {
    if (confirm('确定要删除这个子任务吗？')) {
      try {
        await subTaskStorageIndexedDB.deleteSubTask(subTaskId);
        
        const updatedSubTasks = await subTaskStorageIndexedDB.getSubTasks(task.id);
        console.log('Updated subtasks after delete:', updatedSubTasks);
        setSubTasks(updatedSubTasks);
      } catch (error) {
        console.error('Error deleting subtask:', error);
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg w-3/4 max-w-4xl my-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            子任务管理 - {task.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 子任务列表 */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {subTasks.map((subTask) => (
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
          ))}

          {subTasks.length === 0 && (
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
                      taskId: task.id,
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
  )
}
