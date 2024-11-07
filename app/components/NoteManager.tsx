'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, Edit2, Trash2, Star } from 'lucide-react'
import { Note } from '../data/model'
import { noteStorageIndexedDB } from '../utils/storage-db'
import Card from './Card'
import LoadingSpinner from './LoadingSpinner'

export default function NoteManager() {
  const [notes, setNotes] = useState<Note[]>([])
  const [showAddNote, setShowAddNote] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [newNote, setNewNote] = useState<Note>({
    id: '',
    title: '',
    content: '',
    priority: 5,
    tags: [],
    createdAt: '',
  })
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const savedNotes = await noteStorageIndexedDB.getNotes()
      setNotes(savedNotes)
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetNewNote = () => {
    setNewNote({
      id: '',
      title: '',
      content: '',
      priority: 5,
      tags: [],
      createdAt: '',
    })
  }

  const addNote = async () => {
    if (newNote.title.trim()) {
      await noteStorageIndexedDB.saveNote(newNote)
      await loadNotes()
      setShowAddNote(false)
      resetNewNote()
    }
  }

  const editNote = (note: Note) => {
    setEditingNote(note)
    setNewNote(note)
    setShowAddNote(true)
  }

  const updateNote = async () => {
    if (editingNote && newNote.title.trim()) {
      await noteStorageIndexedDB.saveNote(newNote)
      await loadNotes()
      setShowAddNote(false)
      setEditingNote(null)
      resetNewNote()
    }
  }

  const deleteNote = async (id: string) => {
    if (confirm('确定要删除这条笔记吗？')) {
      await noteStorageIndexedDB.deleteNote(id)
      await loadNotes()
    }
  }

  const renderPriorityStars = (priority: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < priority ? 'text-yellow-500 fill-yellow-500' : 'text-yellow-200'}
      />
    ))
  }

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const filteredNotes = sortedNotes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="搜索笔记..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={() => {
            resetNewNote()
            setShowAddNote(true)
          }}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          <PlusCircle className="mr-2" size={20} />
          新建笔记
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note) => (
          <Card key={note.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{note.title}</h3>
                <div className="flex items-center mt-1">
                  {renderPriorityStars(note.priority)}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => editNote(note)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <p className="mt-2 text-gray-600 whitespace-pre-wrap">{note.content}</p>
            <div className="mt-2 text-sm text-gray-500">
              {new Date(note.createdAt).toLocaleString()}
            </div>
          </Card>
        ))}
      </div>

      {/* 添加/编辑笔记模态框 */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">
              {editingNote ? '编辑笔记' : '新建笔记'}
            </h3>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="标题"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <textarea
                  placeholder="内容"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优先级
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setNewNote({ ...newNote, priority })}
                      className="focus:outline-none"
                    >
                      <Star
                        size={24}
                        className={`${
                          priority <= newNote.priority
                            ? 'text-primary-500 fill-primary-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddNote(false)
                  setEditingNote(null)
                  resetNewNote()
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                取消
              </button>
              <button
                onClick={editingNote ? updateNote : addNote}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                {editingNote ? '更新' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 