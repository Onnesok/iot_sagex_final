'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Shield, UserCog, User } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MANAGER' | 'STUDENT'>('STUDENT')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: selectedRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Check if the user's role matches the selected role
      if (data.user.role !== selectedRole) {
        setError(`This account is not authorized for ${selectedRole} login. Please select the correct role.`)
        setLoading(false)
        return
      }

      // Redirect based on role
      const roleLower = data.user.role.toLowerCase()
      router.push(`/${roleLower}/dashboard`)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const getRoleIcon = () => {
    switch (selectedRole) {
      case 'ADMIN':
        return <Shield className="w-5 h-5" />
      case 'MANAGER':
        return <UserCog className="w-5 h-5" />
      case 'STUDENT':
        return <User className="w-5 h-5" />
    }
  }

  const getRoleColor = () => {
    switch (selectedRole) {
      case 'ADMIN':
        return 'border-red-400/50 text-red-400 bg-red-500/20 hover:bg-red-500/30 hover:border-red-400'
      case 'MANAGER':
        return 'border-blue-400/50 text-blue-400 bg-blue-500/20 hover:bg-blue-500/30 hover:border-blue-400'
      case 'STUDENT':
        return 'border-green-400/50 text-green-400 bg-green-500/20 hover:bg-green-500/30 hover:border-green-400'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-black/50 border border-white/10 rounded-2xl p-8 w-full max-w-md hover:border-green-400/50 transition-all"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4 border border-green-400/30">
            <LogIn className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Login</h1>
          <p className="text-gray-400">Select your role and enter credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Select Role
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('ADMIN')}
                className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center justify-center space-y-2 ${
                  selectedRole === 'ADMIN'
                    ? 'border-red-400/50 bg-red-500/20 text-red-400'
                    : 'border-white/10 hover:border-red-400/30 text-gray-400'
                }`}
              >
                <Shield className="w-6 h-6" />
                <span className="text-xs font-semibold">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('MANAGER')}
                className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center justify-center space-y-2 ${
                  selectedRole === 'MANAGER'
                    ? 'border-blue-400/50 bg-blue-500/20 text-blue-400'
                    : 'border-white/10 hover:border-blue-400/30 text-gray-400'
                }`}
              >
                <UserCog className="w-6 h-6" />
                <span className="text-xs font-semibold">Manager</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('STUDENT')}
                className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center justify-center space-y-2 ${
                  selectedRole === 'STUDENT'
                    ? 'border-green-400/50 bg-green-500/20 text-green-400'
                    : 'border-white/10 hover:border-green-400/30 text-gray-400'
                }`}
              >
                <User className="w-6 h-6" />
                <span className="text-xs font-semibold">Student</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-400/50 focus:outline-none transition-colors"
                placeholder="your.email@cuet.ac.bd"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-400/50 focus:outline-none transition-colors"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Single Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center space-x-3 px-6 py-4 border-2 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getRoleColor()}`}
          >
            {getRoleIcon()}
            <span>{loading ? 'Logging in...' : `Login as ${selectedRole}`}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link href="/enroll" className="text-green-400 hover:text-green-300 transition-colors font-semibold">
              Enroll Now
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
