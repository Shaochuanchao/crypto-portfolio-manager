'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, X } from 'lucide-react'
import { Project, projectStorage } from '../utils/storage'

const PREDEFINED_TAGS = ['空投', 'DeFi', '游戏', 'NFT', 'Layer2', '交易所']

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showAddProject, setShowAddProject] = useState(false)
  const [newProject, setNewProject] = useState<Project>({
    name: '',
    description: '',
    website: '',
    discord: '',
    telegram: '',
    twitter: '',
    isMandatory: false,
    tags: []
  })

  useEffect(() => {
    const savedProjects = projectStorage.getProjects()
    setProjects(savedProjects.length > 0 ? savedProjects : [getExampleProject()])
  }, [])

  useEffect(() => {
    projectStorage.saveProjects(projects)
  }, [projects])

  const getExampleProject = (): Project => ({
    name: '示例项目',
    description: '这是一个示例项目，展示项目管理界面的布局和功能。',
    website: 'https://example.com',
    discord: 'https://discord.gg/example',
    telegram: 'https://t.me/example',
    twitter: 'https://twitter.com/example',
    isMandatory: false,
    tags: ['示例', '空投']
  })

  const addProject = () => {
    if (newProject.name.trim()) {
      setProjects([...projects, {...newProject, name: newProject.name.trim()}])
      setNewProject({
        name: '',
        description: '',
        website: '',
        discord: '',
        telegram: '',
        twitter: '',
        isMandatory: false,
        tags: []
      })
      setShowAddProject(false)
    } else {
      alert('项目名称不能为空！')
    }
  }

  const toggleTag = (tag: string) => {
    setNewProject(prev => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
      return { ...prev, tags: newTags }
    })
  }

  return (
    <div className="bg-yellow-100 rounded-lg p-6 shadow-lg relative">
      <h2 className="text-2xl font-bold mb-4 text-yellow-800">项目管理</h2>
      <div className="absolute top-6 right-6">
        <button onClick={() => setShowAddProject(true)} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded inline-flex items-center">
          <PlusCircle className="mr-2" size={18} />
          <span>新增项目</span>
        </button>
      </div>
      <div className="space-y-4">
        {projects.map((project, index) => (
          <div key={index} className="bg-yellow-50 rounded-md p-4 shadow">
            <h3 className="text-lg font-semibold text-yellow-800">{project.name}</h3>
            <p className="text-yellow-700 mt-2">{project.description}</p>
            <div className="mt-2 space-y-1">
              <p className="text-yellow-600">网站: <a href={project.website} className="text-blue-500 hover:underline">{project.website}</a></p>
              <p className="text-yellow-600">Discord: <a href={project.discord} className="text-blue-500 hover:underline">{project.discord}</a></p>
              <p className="text-yellow-600">Telegram: <a href={project.telegram} className="text-blue-500 hover:underline">{project.telegram}</a></p>
              <p className="text-yellow-600">Twitter: <a href={project.twitter} className="text-blue-500 hover:underline">{project.twitter}</a></p>
            </div>
            <p className="text-yellow-700 mt-2">
              {project.isMandatory ? '必做项目' : '非必做项目'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.tags.map((tag, tagIndex) => (
                <span key={tagIndex} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAddProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-yellow-100 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">新增项目</h3>
            <input
              type="text"
              placeholder="项目名称"
              value={newProject.name}
              onChange={(e) => setNewProject({...newProject, name: e.target.value})}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <textarea
              placeholder="项目简介"
              value={newProject.description}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300 h-20"
            />
            <input
              type="text"
              placeholder="官网地址"
              value={newProject.website}
              onChange={(e) => setNewProject({...newProject, website: e.target.value})}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <input
              type="text"
              placeholder="Discord链接"
              value={newProject.discord}
              onChange={(e) => setNewProject({...newProject, discord: e.target.value})}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <input
              type="text"
              placeholder="Telegram链接"
              value={newProject.telegram}
              onChange={(e) => setNewProject({...newProject, telegram: e.target.value})}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <input
              type="text"
              placeholder="Twitter链接"
              value={newProject.twitter}
              onChange={(e) => setNewProject({...newProject, twitter: e.target.value})}
              className="w-full p-2 mb-2 bg-yellow-50 rounded-md text-yellow-800 placeholder-yellow-500 border border-yellow-300"
            />
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={newProject.isMandatory}
                onChange={(e) => setNewProject({...newProject, isMandatory: e.target.checked})}
                className="mr-2"
              />
              <label className="text-yellow-800">是否为必做项目</label>
            </div>
            <div className="mb-4">
              <p className="text-yellow-800 mb-2">选择标签：</p>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 rounded-full text-sm ${
                      newProject.tags.includes(tag)
                        ? 'bg-yellow-500 text-yellow-900'
                        : 'bg-yellow-200 text-yellow-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowAddProject(false)} className="mr-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-800 font-bold py-2 px-4 rounded">
                取消
              </button>
              <button onClick={addProject} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded">
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
