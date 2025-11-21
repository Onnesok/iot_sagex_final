'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Upload, UserPlus, Camera, CreditCard } from 'lucide-react'

export default function EnrollmentPage() {
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    department: '',
    password: '',
    photo: null as File | null,
    idCard: null as File | null,
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, photo: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, idCard: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setIdCardPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('studentId', formData.studentId)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('department', formData.department)
      formDataToSend.append('password', formData.password)
      formDataToSend.append('role', 'STUDENT')
      if (formData.photo) formDataToSend.append('photo', formData.photo)
      if (formData.idCard) formDataToSend.append('idCard', formData.idCard)

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formDataToSend,
      })

      if (res.ok) {
        // Show success message
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-green-500/20 border border-green-400/50 text-green-400 px-6 py-4 rounded-xl shadow-lg z-50 flex items-center space-x-3'
        successMsg.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="font-semibold">Student enrolled successfully!</span>
        `
        document.body.appendChild(successMsg)
        setTimeout(() => successMsg.remove(), 3000)
        
        setFormData({
          name: '',
          studentId: '',
          email: '',
          department: '',
          password: '',
          photo: null,
          idCard: null,
        })
        setPhotoPreview(null)
        setIdCardPreview(null)
      } else {
        const data = await res.json()
        const errorMsg = data.error || data.details?.map((e: any) => e.message).join(', ') || 'Failed to enroll student'
        
        // Show error message
        const errorDiv = document.createElement('div')
        errorDiv.className = 'fixed top-4 right-4 bg-red-500/20 border border-red-400/50 text-red-400 px-6 py-4 rounded-xl shadow-lg z-50 flex items-center space-x-3 max-w-md'
        errorDiv.innerHTML = `
          <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span class="font-semibold">${errorMsg}</span>
        `
        document.body.appendChild(errorDiv)
        setTimeout(() => errorDiv.remove(), 5000)
      }
    } catch (error) {
      console.error('Error enrolling student:', error)
      alert('Error enrolling student')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout role="admin">
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Enrollment</h1>
          <p className="text-gray-400">Enroll new students into the system</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-black/50 border border-white/10 rounded-xl p-6 space-y-6">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Upload Photo</label>
            <div className="flex items-center space-x-4">
              <div className="w-32 h-32 rounded-full bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center space-x-2 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo</span>
                </label>
              </div>
            </div>
          </div>

          {/* ID Card Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Upload ID Card</label>
            <div className="flex items-center space-x-4">
              <div className="w-48 h-32 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden">
                {idCardPreview ? (
                  <img src={idCardPreview} alt="ID Card Preview" className="w-full h-full object-contain" />
                ) : (
                  <CreditCard className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIdCardChange}
                  className="hidden"
                  id="idcard-upload"
                />
                <label
                  htmlFor="idcard-upload"
                  className="inline-flex items-center space-x-2 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload ID Card</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Student ID *</label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" />
              <span>{loading ? 'Enrolling...' : 'Enroll Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

