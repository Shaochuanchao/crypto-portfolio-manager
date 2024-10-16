'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Wallet, Project, DailyTask, walletStorage, projectStorage, dailyTaskStorage } from '../utils/storage'

export default function DailyTaskTracker() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [airdropProjects, setAirdropProjects] = useState<Project[]>([])
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([])
  const [selectedProject, setSelectedProject] = useState('')

  useEffect(() => {
    setWallets(walletStorage.getWallets())
    setAirdropProjects(projectStorage.getProjects())
    setDailyTasks(dailyTaskStorage.getTasks())

    if (airdropProjects.length > 0) {
      setSelectedProject(airdropProjects[0].name)
    }
  }, [])

  useEffect(() => {
    dailyTaskStorage.saveTasks(dailyTasks)
  }, [dailyTasks])

  const toggleDailyTask = (date: string, project: string, walletAddress: string) => {
    const taskIndex = dailyTasks.findIndex(task => task.date === date && task.project === project)
    if (taskIndex > -1) {
      const updatedTasks = [...dailyTasks]
      const completedWallets = updatedTasks[taskIndex].completedWallets
      const walletIndex = completedWallets.indexOf(walletAddress)
      if (walletIndex > -1) {
        completedWallets.splice(walletIndex, 1)
      } else {
        completedWallets.push(walletAddress)
      }
      setDailyTasks(updatedTasks)
    } else {
      setDailyTasks([...dailyTasks, { date, project, completedWallets: [walletAddress] }])
    }
  }

  return (
    <div className="bg-yellow-100 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-yellow-800">每日任务跟踪</h2>
      <div className="mb-4">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full p-2 bg-yellow-50 rounded-md appearance-none text-yellow-800 border border-yellow-300"
        >
          {airdropProjects.map((project) => (
            <option key={project.name} value={project.name}>{project.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-8 top-24 transform -translate-y-1/2 pointer-events-none text-yellow-800" size={18} />
      </div>
      {selectedProject && (
        <div className="bg-yellow-50 rounded-md p-4">
          <h3 className="text-xl font-bold mb-2 text-yellow-800">{selectedProject}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-yellow-200">
                  <th className="p-2 text-left text-yellow-800">钱包地址</th>
                  <th className="p-2 text-left text-yellow-800">完成状态</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet, walletIndex) => (
                  <tr key={walletIndex} className="border-b border-yellow-200">
                    <td className="p-2 truncate text-yellow-700">{wallet.address}</td>
                    <td className="p-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-yellow-500"
                          checked={dailyTasks.some(task => 
                            task.date === new Date().toISOString().split('T')[0] && 
                            task.project === selectedProject &&
                            task.completedWallets.includes(wallet.address)
                          )}
                          onChange={() => toggleDailyTask(new Date().toISOString().split('T')[0], selectedProject, wallet.address)}
                        />
                        <span className="ml-2 text-yellow-700">已完成</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      
      )}
    </div>
  )
}
