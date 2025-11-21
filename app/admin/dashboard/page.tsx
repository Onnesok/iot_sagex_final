'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { Users, UtensilsCrossed, AlertTriangle, UserCog, FileText, Shield } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    mealsServedToday: 0,
    fraudAlerts: 0,
    activeManagers: 0,
    activeMealPlans: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalStudents: data.totalUsers || 0,
          mealsServedToday: data.todayMeals || 0,
          fraudAlerts: data.fraudAlerts || 0,
          activeManagers: data.activeManagers || 0,
          activeMealPlans: data.activeMealPlans || 0,
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">System overview and management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-green-400/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-green-400">{stats.totalStudents}</p>
              </div>
              <Users className="w-12 h-12 text-green-400/20" />
            </div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-green-400/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Meals Served Today</p>
                <p className="text-3xl font-bold text-green-400">{stats.mealsServedToday}</p>
              </div>
              <UtensilsCrossed className="w-12 h-12 text-green-400/20" />
            </div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-red-400/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Fraud Alerts</p>
                <p className="text-3xl font-bold text-red-400">{stats.fraudAlerts}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-400/20" />
            </div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-green-400/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Managers</p>
                <p className="text-3xl font-bold text-green-400">{stats.activeManagers}</p>
              </div>
              <UserCog className="w-12 h-12 text-green-400/20" />
            </div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-green-400/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Meal Plans</p>
                <p className="text-3xl font-bold text-green-400">{stats.activeMealPlans}</p>
              </div>
              <FileText className="w-12 h-12 text-green-400/20" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/students"
              className="p-4 border border-white/10 rounded-lg hover:border-green-400/50 hover:bg-green-500/10 transition-all"
            >
              <Users className="w-6 h-6 text-green-400 mb-2" />
              <h3 className="font-semibold text-white">View Students</h3>
              <p className="text-sm text-gray-400">Manage student accounts</p>
            </Link>
            <Link
              href="/admin/meals"
              className="p-4 border border-white/10 rounded-lg hover:border-green-400/50 hover:bg-green-500/10 transition-all"
            >
              <UtensilsCrossed className="w-6 h-6 text-green-400 mb-2" />
              <h3 className="font-semibold text-white">All Meal Records</h3>
              <p className="text-sm text-gray-400">View all meal requests</p>
            </Link>
            <Link
              href="/admin/meal-plans"
              className="p-4 border border-white/10 rounded-lg hover:border-green-400/50 hover:bg-green-500/10 transition-all"
            >
              <UtensilsCrossed className="w-6 h-6 text-green-400 mb-2" />
              <h3 className="font-semibold text-white">Manage Meal Plans</h3>
              <p className="text-sm text-gray-400">Create and edit meal plans</p>
            </Link>
            <Link
              href="/admin/managers"
              className="p-4 border border-white/10 rounded-lg hover:border-green-400/50 hover:bg-green-500/10 transition-all"
            >
              <UserCog className="w-6 h-6 text-green-400 mb-2" />
              <h3 className="font-semibold text-white">Managers</h3>
              <p className="text-sm text-gray-400">Manage manager accounts</p>
            </Link>
            <Link
              href="/admin/users"
              className="p-4 border border-white/10 rounded-lg hover:border-green-400/50 hover:bg-green-500/10 transition-all"
            >
              <Users className="w-6 h-6 text-green-400 mb-2" />
              <h3 className="font-semibold text-white">All Users</h3>
              <p className="text-sm text-gray-400">View all system users</p>
            </Link>
            <Link
              href="/admin/reports"
              className="p-4 border border-white/10 rounded-lg hover:border-green-400/50 hover:bg-green-500/10 transition-all"
            >
              <FileText className="w-6 h-6 text-green-400 mb-2" />
              <h3 className="font-semibold text-white">Reports</h3>
              <p className="text-sm text-gray-400">View system reports</p>
            </Link>
            <Link
              href="/admin/fraud-alerts"
              className="p-4 border border-white/10 rounded-lg hover:border-red-400/50 hover:bg-red-500/10 transition-all"
            >
              <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
              <h3 className="font-semibold text-white">Fraud Alerts</h3>
              <p className="text-sm text-gray-400">Security alerts</p>
            </Link>
            <Link
              href="/admin/enrollment"
              className="p-4 border border-white/10 rounded-lg hover:border-green-400/50 hover:bg-green-500/10 transition-all"
            >
              <UserCog className="w-6 h-6 text-green-400 mb-2" />
              <h3 className="font-semibold text-white">Enrollment</h3>
              <p className="text-sm text-gray-400">Enroll new students</p>
            </Link>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/admin/fraud-alerts"
            className="bg-black/50 border border-red-400/30 rounded-xl p-6 hover:border-red-400/50 hover:bg-red-500/10 transition-all"
          >
            <div className="flex items-center space-x-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Fraud Alerts</h3>
                <p className="text-sm text-gray-400">View and manage security alerts</p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/enrollment"
            className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-green-400/50 hover:bg-green-500/10 transition-all"
          >
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Enrollment</h3>
                <p className="text-sm text-gray-400">Manage student enrollments</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  )
}

