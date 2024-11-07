import { Task } from '../data/model'
import { Edit2, Trash2, List, CheckSquare, CheckCircle, Circle, Star, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface TaskCardProps {
  task: Task
  isCompleted: boolean
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onToggleCompletion: (id: string) => void
  onShowSubTasks: (task: Task) => void
  getProjectName: (projectId: string) => string
  subTaskCount: number
}

export default function TaskCard({
  task,
  isCompleted,
  onEdit,
  onDelete,
  onToggleCompletion,
  onShowSubTasks,
  getProjectName,
  subTaskCount
}: TaskCardProps) {
  const renderPriorityStars = (priority: number = 5) => {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < priority ? 'text-primary-500 fill-primary-500' : 'text-gray-300'}
      />
    ))
  }

  return (
    <div 
      className={`relative bg-white rounded-lg shadow-sm border overflow-hidden transition-all transform hover:scale-[1.02] duration-200 ${
        isCompleted 
          ? 'border-gray-200 opacity-75' 
          : 'border-primary-200 hover:shadow-lg hover:border-primary-400'
      }`}
    >
      {/* 左侧强调条 */}
      {!isCompleted && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
      )}

      {/* 头部：完成状态和操作按钮 */}
      <div className={`px-4 py-3 border-b flex justify-between items-center ${
        isCompleted 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-primary-50 border-primary-100'
      }`}>
        <button
          onClick={() => onToggleCompletion(task.id)}
          className={`group flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            isCompleted 
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
              : 'bg-white text-primary-700 hover:bg-primary-100'
          }`}
        >
          {isCompleted ? (
            <CheckCircle size={18} className="text-gray-500 group-hover:text-gray-600" />
          ) : (
            <Circle size={18} className="text-primary-500 group-hover:text-primary-600" />
          )}
          <span>{isCompleted ? '已完成' : '待完成'}</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(task)}
            className="text-gray-400 hover:text-primary-600 transition-colors p-1 rounded-full hover:bg-primary-50"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* 主要内容 */}
      <div className={`p-4 ${!isCompleted && 'bg-primary-50/30'}`}>
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.name}</h3>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${isCompleted ? 'text-gray-500' : 'text-primary-600'}`}>
              {task.isDaily ? '每日任务' : '一次性任务'}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">
              {getProjectName(task.projectId)}
            </span>
          </div>
        </div>

        {/* 优先级和备注 */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            {renderPriorityStars(task.priority)}
          </div>
          {task.priorityNote && (
            <p className="mt-1 text-sm text-gray-600">{task.priorityNote}</p>
          )}
        </div>

        {/* 任务描述 */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
        )}

        {/* 底部信息 */}
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onShowSubTasks(task)}
              className={`flex items-center text-sm transition-colors ${
                isCompleted 
                  ? 'text-gray-500 hover:text-gray-700' 
                  : 'text-primary-600 hover:text-primary-700'
              }`}
            >
              <List size={16} className="mr-1" />
              子任务 ({subTaskCount})
            </button>
            {task.guideLink && (
              <a
                href={task.guideLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center text-sm transition-colors ${
                  isCompleted 
                    ? 'text-gray-500 hover:text-gray-700' 
                    : 'text-primary-600 hover:text-primary-700'
                }`}
              >
                <ExternalLink size={16} className="mr-1" />
                查看攻略
              </a>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {task.endDate && `截止: ${task.endDate}`}
          </div>
        </div>
      </div>
    </div>
  )
} 