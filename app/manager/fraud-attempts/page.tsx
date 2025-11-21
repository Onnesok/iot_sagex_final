'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Eye, Clock, User } from 'lucide-react'

interface FraudAttempt {
  id: string
  type: 'FACE_MISMATCH' | 'DOUBLE_SERVING' | 'SUSPICIOUS_ENTRY'
  studentId: string
  studentName: string
  description: string
  timestamp: string
  status: string
}

export default function FraudAttemptsPage() {
  const [attempts, setAttempts] = useState<FraudAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAttempt, setSelectedAttempt] = useState<FraudAttempt | null>(null)

  useEffect(() => {
    fetchFraudAttempts()
    const interval = setInterval(fetchFraudAttempts, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchFraudAttempts = async () => {
    try {
      const res = await fetch('/api/manager/fraud-attempts')
      if (res.ok) {
        const data = await res.json()
        setAttempts(data)
      }
    } catch (error) {
      console.error('Error fetching fraud attempts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAttemptTypeLabel = (type: string) => {
    switch (type) {
      case 'FACE_MISMATCH':
        return 'Face Mismatch'
      case 'DOUBLE_SERVING':
        return 'Double Serving'
      case 'DENIED_MEAL':
        return 'Denied Meal'
      case 'SUSPICIOUS_ENTRY':
        return 'Suspicious Entry'
      default:
        return type
    }
  }

  const getAttemptTypeColor = (type: string) => {
    switch (type) {
      case 'FACE_MISMATCH':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30'
      case 'DOUBLE_SERVING':
        return 'text-red-400 bg-red-500/20 border-red-400/30'
      case 'DENIED_MEAL':
        return 'text-red-400 bg-red-500/20 border-red-400/30'
      case 'SUSPICIOUS_ENTRY':
        return 'text-orange-400 bg-orange-500/20 border-orange-400/30'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-400/30'
    }
  }

  if (loading) {
    return (
      <Layout role="manager">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="manager">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/manager/dashboard"
              className="p-2 border border-white/20 rounded-lg hover:border-green-400/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Fraud Attempts</h1>
              <p className="text-gray-400">Flagged suspicious activities</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-black/50 border border-red-400/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Total Flagged Attempts</p>
                <p className="text-3xl font-bold text-red-400">{attempts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attempts List */}
        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Flagged Entries</h2>
          </div>
          <div className="divide-y divide-white/10">
            {attempts.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No fraud attempts found</p>
              </div>
            ) : (
              attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="p-6 hover:bg-white/5 transition-colors bg-red-500/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold border ${getAttemptTypeColor(
                            attempt.type
                          )}`}
                        >
                          {getAttemptTypeLabel(attempt.type)}
                        </span>
                        <span className="px-2 py-1 bg-red-500/20 border border-red-400/30 text-red-400 rounded text-xs font-semibold">
                          {attempt.status}
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{attempt.studentName}</span>
                          <span className="text-gray-500">({attempt.studentId})</span>
                        </div>
                        <p className="text-gray-400">{attempt.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(attempt.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <button
                        onClick={() => setSelectedAttempt(attempt)}
                        className="px-4 py-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors text-sm font-semibold flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <Link
            href="/manager/dashboard"
            className="flex items-center space-x-2 px-6 py-3 border border-white/20 rounded-lg hover:border-green-400/50 transition-colors text-white font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>

        {/* Detail Modal */}
        {selectedAttempt && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black border border-white/20 rounded-xl p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Fraud Attempt Details</h2>
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <p className="text-white">{getAttemptTypeLabel(selectedAttempt.type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Student</label>
                  <p className="text-white">{selectedAttempt.studentName} ({selectedAttempt.studentId})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <p className="text-white">{selectedAttempt.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Timestamp</label>
                  <p className="text-white">{new Date(selectedAttempt.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                  <p className="text-white">{selectedAttempt.status}</p>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setSelectedAttempt(null)}
                    className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

