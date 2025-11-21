'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function ManagerApprovalsPage() {
  const [meals, setMeals] = useState<any[]>([])
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DENIED'>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMeals()
    const interval = setInterval(fetchMeals, 5000)
    return () => clearInterval(interval)
  }, [filter])

  const fetchMeals = async () => {
    try {
      const res = await fetch(`/api/manager/meals?filter=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setMeals(data)
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
    } finally {
      setLoading(false)
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
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Meal Approvals</h1>
            <p className="text-gray-400">Review and manage all meal requests</p>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DENIED">Denied</option>
            </select>
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="divide-y divide-white/10">
            {meals.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No meal records found</p>
              </div>
            ) : (
              meals.map((meal) => (
                <div key={meal.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-white">
                          {meal.student.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          meal.status === 'APPROVED' || meal.status === 'COMPLETED'
                            ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                            : meal.status === 'DENIED'
                            ? 'bg-red-500/20 text-red-400 border border-red-400/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                        }`}>
                          {meal.status}
                        </span>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-full text-sm">
                          {meal.verificationMethod}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400 mb-3">
                        <div>
                          <span className="font-medium text-gray-300">Student ID:</span> {meal.student.studentId || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-300">Email:</span> {meal.student.email}
                        </div>
                        <div>
                          <span className="font-medium text-gray-300">Requested:</span> {formatDateTime(meal.requestedAt)}
                        </div>
                        {meal.approvedAt && (
                          <div>
                            <span className="font-medium text-gray-300">Processed:</span> {formatDateTime(meal.approvedAt)}
                          </div>
                        )}
                      </div>
                      {meal.deniedReason && (
                        <div className="mt-2 p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
                          <p className="text-sm text-red-400">
                            <span className="font-medium">Denial Reason:</span> {meal.deniedReason}
                          </p>
                        </div>
                      )}
                    </div>
                    {meal.status === 'PENDING' && (
                      <div className="flex space-x-3 ml-6">
                        <button
                          onClick={() => {
                            if (confirm('Approve this meal request?')) {
                              fetch('/api/manager/approve-meal', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ mealId: meal.id, approved: true }),
                              }).then(() => fetchMeals())
                            }
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for denial:')
                            if (reason) {
                              fetch('/api/manager/approve-meal', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ mealId: meal.id, approved: false, reason }),
                              }).then(() => fetchMeals())
                            }
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-400/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-semibold"
                        >
                          <XCircle className="w-5 h-5" />
                          <span>Deny</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

