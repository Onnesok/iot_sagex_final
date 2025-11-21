'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { UserCog, Plus, Edit, Trash2, Mail, Shield, Search, AlertCircle, CheckCircle, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Manager {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingManager, setEditingManager] = useState<Manager | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    fetchManagers()
  }, [])

  const fetchManagers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        // API returns array directly
        const managerList = Array.isArray(data) ? data.filter((u: any) => u.role === 'MANAGER') : []
        setManagers(managerList)
      }
    } catch (error) {
      console.error('Error fetching managers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    
    try {
      const url = editingManager 
        ? `/api/admin/users/${editingManager.id}`
        : '/api/auth/register'
      
      const method = editingManager ? 'PUT' : 'POST'
      
      const body: any = {
        name: formData.name,
        email: formData.email,
        role: 'MANAGER',
      }
      
      // Only include password if provided (for new managers or when updating)
      if (!editingManager || formData.password) {
        if (!formData.password || formData.password.length < 6) {
          setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
          return
        }
        body.password = formData.password
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: editingManager ? 'Manager updated successfully!' : 'Manager created successfully!' })
        setShowModal(false)
        setEditingManager(null)
        setFormData({ name: '', email: '', password: '' })
        setTimeout(() => {
          setMessage(null)
          fetchManagers()
        }, 1000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save manager' })
      }
    } catch (error) {
      console.error('Error saving manager:', error)
      setMessage({ type: 'error', text: 'An error occurred while saving manager' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this manager?')) return
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Manager deleted successfully!' })
        setTimeout(() => {
          setMessage(null)
          fetchManagers()
        }, 1000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete manager' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      console.error('Error deleting manager:', error)
      setMessage({ type: 'error', text: 'An error occurred while deleting manager' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Layout role="admin">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Managers</h1>
            <p className="text-gray-400">Manage manager accounts</p>
          </div>
          <button
            onClick={() => {
              setEditingManager(null)
              setFormData({ name: '', email: '', password: '' })
              setMessage(null)
              setShowModal(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Add Manager</span>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg border flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-400/30 text-green-400'
              : 'bg-red-500/10 border-red-400/30 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search managers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50"
          />
        </div>

        {/* Managers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredManagers.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-black/50 border border-white/10 rounded-xl">
              <UserCog className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-20" />
              <p className="text-gray-400">
                {searchTerm ? 'No managers found matching your search' : 'No managers found'}
              </p>
            </div>
          ) : (
            filteredManagers.map((manager) => (
              <div
                key={manager.id}
                className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-green-400/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{manager.name}</h3>
                      <p className="text-sm text-gray-400 flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{manager.email}</span>
                      </p>
                      {manager.createdAt && (
                        <p className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>Created: {formatDate(manager.createdAt)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setEditingManager(manager)
                      setFormData({
                        name: manager.name,
                        email: manager.email,
                        password: '',
                      })
                      setMessage(null)
                      setShowModal(true)
                    }}
                    className="flex-1 px-3 py-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors text-sm font-semibold"
                  >
                    Edit Manager
                  </button>
                  <button
                    onClick={() => handleDelete(manager.id)}
                    className="px-3 py-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingManager ? 'Edit Manager' : 'Add Manager'}
              </h2>
              
              {message && (
                <div className={`mb-4 p-3 rounded-lg border flex items-center space-x-2 ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border-green-400/30 text-green-400'
                    : 'bg-red-500/10 border-red-400/30 text-red-400'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                    placeholder="Manager name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                    placeholder="manager@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Password {editingManager ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingManager}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                    placeholder={editingManager ? "Leave blank to keep current password" : "Minimum 6 characters"}
                    minLength={editingManager ? 0 : 6}
                  />
                  {editingManager && (
                    <p className="mt-1 text-xs text-gray-500">Leave blank to keep the current password</p>
                  )}
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingManager(null)
                      setMessage(null)
                      setFormData({ name: '', email: '', password: '' })
                    }}
                    className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold"
                  >
                    {editingManager ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

