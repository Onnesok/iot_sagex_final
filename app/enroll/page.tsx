'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserPlus, Mail, Lock, User, CreditCard } from 'lucide-react'

export default function EnrollPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    idCardNumber: '',
    pin: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          studentId: formData.studentId,
          role: 'STUDENT',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMessage = data.error || data.details?.map((e: any) => e.message).join(', ') || 'Registration failed'
        setError(errorMessage)
        return
      }

      if (formData.idCardNumber || formData.pin) {
        await fetch('/api/users/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idCardNumber: formData.idCardNumber || undefined,
            pin: formData.pin || undefined,
          }),
        })
      }

      router.push('/student/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 pt-24">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/50 border border-white/10 rounded-2xl p-8 hover:border-green-400/50 transition-all"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4 border border-green-400/30">
              <UserPlus className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">New Enrollment</h1>
            <p className="text-gray-400">Register for tokenless dining system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-400/50 focus:outline-none transition-colors"
                    placeholder="Piyal Chakraborty"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Student ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-400/50 focus:outline-none transition-colors"
                  placeholder="CUET-2024-XXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-400/50 focus:outline-none transition-colors"
                  placeholder="your.email@cuet.ac.bd"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-400/50 focus:outline-none transition-colors"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-400/50 focus:outline-none transition-colors"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Verification Methods (Optional - Can be added later)
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    ID Card Number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.idCardNumber}
                      onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-400/50 focus:outline-none transition-colors"
                      placeholder="ID-XXXX-XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    PIN (4 digits)
                  </label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    maxLength={4}
                    pattern="[0-9]{4}"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-400/50 focus:outline-none transition-colors"
                    placeholder="1234"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500/20 border border-green-400/50 text-green-400 py-3 rounded-full font-semibold hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enrolling...' : 'Complete Enrollment'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-green-400 hover:text-green-300 transition-colors font-semibold">
                Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
