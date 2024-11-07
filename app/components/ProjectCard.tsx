import { Project } from '../data/model'
import { Edit2, Trash2, RefreshCw, Copy, Globe, MessageCircle, Send, Twitter } from 'lucide-react'
import { 
  WebsiteIcon, 
  DiscordIcon, 
  TelegramIcon, 
  TwitterIcon, 
  MandatoryIcon,
  StageIcon,
  AirdropIcon,
  PriceIcon,
  EndDateIcon
} from './icons'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
  getTagColor: (tag: string) => string
  copyToClipboard: (text: string) => void
  getWalletDisplayName: (address: string) => string
  isProjectExpired: (project: Project) => boolean
}

// 添加 shortenInfo 函数
const shortenInfo = (info: string | undefined, maxLength: number = 20): string => {
  if (!info) return '未设置';
  if (info.length <= maxLength) return info;
  return `${info.slice(0, maxLength)}...`;
};

// 修改 isValidUrl 函数的判断逻辑
const isValidUrl = (url: string | undefined): boolean => {
  return Boolean(url?.trim());
};

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  onRestore,
  getTagColor,
  copyToClipboard,
  getWalletDisplayName,
  isProjectExpired
}: ProjectCardProps) {
  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${
      project.isDeleted 
        ? 'bg-gray-100 border border-gray-200' 
        : isProjectExpired(project)
          ? 'bg-red-50 border border-red-200'
          : 'bg-white border border-primary-100'
    }`}>
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              {project.name}
              {project.isMandatory && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full ">
                  必做
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {!project.isDeleted && (
                <button onClick={() => onEdit(project)} className="text-gray-400 hover:text-primary-600 transition-colors">
                  <Edit2 size={18} />
                </button>
              )}
              <button 
                onClick={() => project.isDeleted ? onRestore(project.id) : onDelete(project.id)} 
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                {project.isDeleted ? <RefreshCw size={18} /> : <Trash2 size={18} />}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">{project.description}</p>
        </div>
      </div>

      {/* 链接信息 */}
      <div className="mt-4 mb-4 px-4 grid grid-cols-2 gap-4">
        {isValidUrl(project.website) ? (
          <a 
            href={project.website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Globe size={16} className="mr-2" />
            {shortenInfo(project.website)}
          </a>
        ) : (
          <div className="flex items-center text-sm text-gray-400">
            <Globe size={16} className="mr-2" />
            未设置
          </div>
        )}
        
        {isValidUrl(project.discord) ? (
          <a 
            href={project.discord} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            <MessageCircle size={16} className="mr-2" />
            {shortenInfo(project.discord)}
          </a>
        ) : (
          <div className="flex items-center text-sm text-gray-400">
            <MessageCircle size={16} className="mr-2" />
            未设置
          </div>
        )}
        
        {isValidUrl(project.telegram) ? (
          <a 
            href={project.telegram} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Send size={16} className="mr-2" />
            {shortenInfo(project.telegram)}
          </a>
        ) : (
          <div className="flex items-center text-sm text-gray-400">
            <Send size={16} className="mr-2" />
            未设置
          </div>
        )}
        
        {isValidUrl(project.twitter) ? (
          <a 
            href={project.twitter} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Twitter size={16} className="mr-2" />
            {shortenInfo(project.twitter)}
          </a>
        ) : (
          <div className="flex items-center text-sm text-gray-400">
            <Twitter size={16} className="mr-2" />
            未设置
          </div>
        )}
      </div>

      {/* 项目状态 */}
      <div className="p-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <StageIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">阶段: {project.stage}</span>
          </div>
          <div className="flex items-center space-x-2">
            <AirdropIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">空投: {project.airdropStage}</span>
          </div>
          <div className="flex items-center space-x-2">
            <PriceIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">预估: ${project.estimatedPrice || '未知'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <EndDateIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">截止: {project.endDate || '未设置'}</span>
          </div>
        </div>
      </div>

      {/* 标签 */}
      <div className="px-4 py-2 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {project.tags && project.tags.length > 0 ? (
            project.tags.map((tag, index) => (
              <span key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}>
                {tag}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">无标签</span>
          )}
        </div>
      </div>

      {/* 关联钱包 */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {project.relatedWallets && project.relatedWallets.length > 0 ? (
            project.relatedWallets.map((address, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getWalletDisplayName(address)}
                <button 
                  onClick={() => copyToClipboard(address)} 
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <Copy size={12} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">无关联钱包</span>
          )}
        </div>
      </div>
    </div>
  )
} 