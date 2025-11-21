'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { UtensilsCrossed, CheckCircle, Clock, XCircle, CreditCard, User, Calendar, Camera, AlertCircle, History } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    activeTokens: 0,
    activeEnrollments: 0,
    todayMeals: 0,
  })
  const [recentMeals, setRecentMeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [userRes, statsRes, mealsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/student/stats'),
        fetch('/api/student/recent-meals'),
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (mealsRes.ok) {
        const mealsData = await mealsRes.json()
        setRecentMeals(mealsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestMeal = async () => {
    try {
      const res = await fetch('/api/student/request-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationMethod: 'MANUAL', // In real system, this would come from hardware
        }),
      })

      if (res.ok) {
        alert('Meal request submitted! Please wait for manager approval.')
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to request meal')
      }
    } catch (error) {
      alert('Error requesting meal')
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
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Student Home</h1>
          <p className="text-gray-400">Your dining information</p>
        </div>

        {/* Student Info Card */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-start space-x-6">
            {/* Photo */}
            <div className="w-24 h-24 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center overflow-hidden">
              {user?.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-green-400">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            
            {/* Student Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{user?.name || 'Student'}</h2>
                <p className="text-gray-400 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Student ID: {user?.studentId || 'N/A'}</span>
                </p>
                <p className="text-gray-400 mt-2">
                  Department: {user?.department || 'N/A'}
                </p>
              </div>
              
              {/* Meal Plan Info */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Meal Plan Type</p>
                  <p className="text-lg font-semibold text-green-400">
                    {stats.activeEnrollments > 0 ? 'Active Plan' : 'No Active Plan'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Meal Plan Expiry</p>
                  <p className="text-lg font-semibold text-white flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>--</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-black/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Tokens</p>
                <p className="text-3xl font-bold text-green-400">{stats.activeTokens}</p>
              </div>
              <CreditCard className="w-12 h-12 text-green-400/20" />
            </div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Meal Plans</p>
                <p className="text-3xl font-bold text-green-400">{stats.activeEnrollments}</p>
              </div>
              <UtensilsCrossed className="w-12 h-12 text-green-400/20" />
            </div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Today's Meals</p>
                <p className="text-3xl font-bold text-green-400">{stats.todayMeals}</p>
              </div>
              <Calendar className="w-12 h-12 text-green-400/20" />
            </div>
          </div>
        </div>

        {/* Request Meal Button */}
        {(stats.activeTokens > 0 || stats.activeEnrollments > 0) && stats.todayMeals === 0 && (
          <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Ready to Request a Meal?</h3>
                <p className="text-gray-400">You have active tokens or meal plans available</p>
              </div>
              <button
                onClick={requestMeal}
                className="px-6 py-3 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold flex items-center space-x-2"
              >
                <UtensilsCrossed className="w-5 h-5" />
                <span>Request Meal</span>
              </button>
            </div>
          </div>
        )}

        {/* Recent Meals */}
        {recentMeals.length > 0 && (
          <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Recent Meal Requests</h2>
            </div>
            <div className="divide-y divide-white/10">
              {recentMeals.map((meal: any) => (
                <div key={meal.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {meal.status === 'COMPLETED' || meal.status === 'APPROVED' ? (
                          <span className="px-3 py-1 bg-green-500/20 border border-green-400/30 text-green-400 rounded-full text-sm font-semibold flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Served</span>
                          </span>
                        ) : meal.status === 'DENIED' ? (
                          <span className="px-3 py-1 bg-red-500/20 border border-red-400/30 text-red-400 rounded-full text-sm font-semibold flex items-center space-x-2">
                            <XCircle className="w-4 h-4" />
                            <span>Denied</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-400/30 text-yellow-400 rounded-full text-sm font-semibold flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Pending</span>
                          </span>
                        )}
                        <span className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-400 rounded text-xs">
                          {meal.verificationMethod}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <p>Requested: {formatDateTime(meal.requestedAt)}</p>
                        {meal.completedAt && (
                          <p className="text-green-400">Completed: {formatDateTime(meal.completedAt)}</p>
                        )}
                        {meal.deniedReason && (
                          <p className="text-red-400 mt-1">Reason: {meal.deniedReason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10 text-center">
              <Link
                href="/student/meal-history"
                className="text-green-400 hover:text-green-300 text-sm font-semibold"
              >
                View All Meal History →
              </Link>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/student/tokens"
            className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-green-400/50 hover:bg-green-500/10 transition-all text-center"
          >
            <CreditCard className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-1">My Tokens</h3>
            <p className="text-xs text-gray-400">View tokens & plans</p>
          </Link>
          <Link
            href="/student/meal-history"
            className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-green-400/50 hover:bg-green-500/10 transition-all text-center"
          >
            <History className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-1">Meal History</h3>
            <p className="text-xs text-gray-400">View past meals</p>
          </Link>
          <Link
            href="/student/remaining-meals"
            className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-green-400/50 hover:bg-green-500/10 transition-all text-center"
          >
            <UtensilsCrossed className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-1">Remaining Meals</h3>
            <p className="text-xs text-gray-400">Check balance</p>
          </Link>
          <Link
            href="/student/profile"
            className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-green-400/50 hover:bg-green-500/10 transition-all text-center"
          >
            <User className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-1">My Profile</h3>
            <p className="text-xs text-gray-400">Manage settings</p>
          </Link>
        </div>
      </div>
    </Layout>
  )
}

