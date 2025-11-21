'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { User, CreditCard, Key, Camera } from 'lucide-react'

export default function StudentProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    idCardNumber: '',
    pin: '',
    faceId: '',
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setFormData({
          idCardNumber: data.user.idCardNumber || '',
          pin: data.user.pin || '',
          faceId: data.user.faceId || '',
        })
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    try {
      const res = await fetch('/api/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setMessage('Profile updated successfully!')
        fetchUser()
      } else {
        const data = await res.json()
        setMessage(data.error || 'Failed to update profile')
      }
    } catch (error) {
      setMessage('Error updating profile')
    }
  }

  if (loading) {
    return (
      <Layout role="student">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="student">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your verification methods</p>
        </div>

        <div className="bg-black/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center">
              {user?.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-green-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
              <p className="text-gray-400">{user?.email}</p>
              {user?.studentId && (
                <p className="text-sm text-gray-500">ID: {user.studentId}</p>
              )}
            </div>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-lg border ${
              message.includes('success') 
                ? 'bg-green-500/10 border-green-400/30 text-green-400' 
                : 'bg-red-500/10 border-red-400/30 text-red-400'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>ID Card Number</span>
                </div>
              </label>
              <input
                type="text"
                value={formData.idCardNumber}
                onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400/50"
                placeholder="ID-XXXX-XXXX"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter your ID card number for card-based verification
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>PIN (4 digits)</span>
                </div>
              </label>
              <input
                type="text"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                maxLength={4}
                pattern="[0-9]{4}"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400/50"
                placeholder="1234"
              />
              <p className="mt-1 text-sm text-gray-500">
                Set a 4-digit PIN for PIN-based verification
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Face ID</span>
                </div>
              </label>
              <input
                type="text"
                value={formData.faceId}
                onChange={(e) => setFormData({ ...formData, faceId: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed"
                placeholder="Face recognition ID (set by system)"
                disabled
              />
              <p className="mt-1 text-sm text-gray-500">
                Face ID is set automatically during face recognition enrollment
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-green-500/20 border border-green-400/50 text-green-400 py-3 rounded-lg font-semibold hover:bg-green-500/30 transition-colors"
            >
              Update Profile
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}

