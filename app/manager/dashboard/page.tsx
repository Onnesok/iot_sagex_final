'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, Users, UtensilsCrossed, RefreshCw } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface PendingMeal {
  id: string
  student: {
    name: string
    studentId: string | null
    email: string
  }
  status: string
  requestedAt: string
  verificationMethod: string
  token?: { tokenNumber: string } | null
  enrollment?: { mealPlan: { name: string } } | null
}

export default function ManagerDashboard() {
  const [pendingMeals, setPendingMeals] = useState<PendingMeal[]>([])
  const [stats, setStats] = useState({
    todayApproved: 0,
    todayDenied: 0,
    pending: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [mealsRes, statsRes] = await Promise.all([
        fetch('/api/manager/pending-meals'),
        fetch('/api/manager/stats'),
      ])

      if (mealsRes.ok) {
        const meals = await mealsRes.json()
        setPendingMeals(meals)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (mealId: string, approved: boolean, reason?: string) => {
    try {
      const res = await fetch('/api/manager/approve-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealId,
          approved,
          reason,
        }),
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error approving meal:', error)
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
            <h1 className="text-3xl font-bold text-white mb-2">Manager Home</h1>
            <p className="text-gray-400">Students waiting for verification</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 px-4 py-2 border border-white/20 rounded-lg hover:border-green-400/50 transition-colors text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-black/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-400/20" />
            </div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Today Approved</p>
                <p className="text-3xl font-bold text-green-400">{stats.todayApproved}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400/20" />
            </div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Today Denied</p>
                <p className="text-3xl font-bold text-red-400">{stats.todayDenied}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-400/20" />
            </div>
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Pending Meal Requests</h2>
          </div>
          <div className="divide-y divide-white/10">
            {pendingMeals.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No pending meal requests</p>
              </div>
            ) : (
              pendingMeals.map((meal) => (
                <div key={meal.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-400 font-semibold">
                            {meal.student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {meal.student.name}
                          </h3>
                          <p className="text-sm text-gray-400">{meal.student.studentId || 'N/A'}</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-400 rounded-full text-sm">
                          {meal.verificationMethod}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400 mb-4 ml-16">
                        <div>
                          <span className="font-medium text-gray-300">Email:</span> {meal.student.email}
                        </div>
                        <div>
                          <span className="font-medium text-gray-300">Requested:</span> {formatDateTime(meal.requestedAt)}
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-300">Eligibility:</span>{' '}
                          {meal.token ? (
                            <span className="text-green-400">Token #{meal.token.tokenNumber}</span>
                          ) : meal.enrollment ? (
                            <span className="text-green-400">Meal Plan: {meal.enrollment.mealPlan.name}</span>
                          ) : (
                            <span className="text-red-400">No active eligibility</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-16 mb-2">
                        <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-400/30 text-yellow-400 rounded-full text-xs font-semibold">
                          Already Ate Today? Check status
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-3 ml-6">
                      <button
                        onClick={() => handleApproval(meal.id, true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>APPROVE</span>
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for denial:')
                          if (reason) handleApproval(meal.id, false, reason)
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-red-500/20 border border-red-400/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-semibold"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>DENY</span>
                      </button>
                    </div>
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

