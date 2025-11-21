'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { UtensilsCrossed, Filter, Search, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'

interface MealRecord {
  id: string
  status: string
  requestedAt: string
  approvedAt?: string
  completedAt?: string
  deniedReason?: string
  verificationMethod: string
  student: {
    id: string
    name: string
    email: string
    studentId: string
  }
  token?: {
    tokenNumber: string
  }
  enrollment?: {
    mealPlan: {
      name: string
    }
  }
}

export default function AdminMealsPage() {
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMeals()
  }, [filter])

  const fetchMeals = async () => {
    try {
      const res = await fetch(`/api/admin/meals?filter=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setMeals(data.meals || [])
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMeals = meals.filter((meal) =>
    meal.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meal.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meal.student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400 border-green-400/30'
      case 'APPROVED':
        return 'bg-blue-500/20 text-blue-400 border-blue-400/30'
      case 'DENIED':
        return 'bg-red-500/20 text-red-400 border-red-400/30'
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-400/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />
      case 'DENIED':
        return <XCircle className="w-4 h-4" />
      case 'PENDING':
        return <Clock className="w-4 h-4" />
      default:
        return null
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
          <h1 className="text-3xl font-bold text-white mb-2">All Meal Records</h1>
          <p className="text-gray-400">View and monitor all meal requests in the system</p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DENIED">Denied</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-black/50 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Total Records</p>
            <p className="text-2xl font-bold text-white">{meals.length}</p>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">
              {meals.filter((m) => m.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-400">
              {meals.filter((m) => m.status === 'COMPLETED').length}
            </p>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Denied</p>
            <p className="text-2xl font-bold text-red-400">
              {meals.filter((m) => m.status === 'DENIED').length}
            </p>
          </div>
        </div>

        {/* Meals Table */}
        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Verification</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Source</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Requested</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredMeals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No meal records found</p>
                    </td>
                  </tr>
                ) : (
                  filteredMeals.map((meal) => (
                    <tr key={meal.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">{meal.student.name}</div>
                          <div className="text-sm text-gray-400">{meal.student.studentId}</div>
                          <div className="text-xs text-gray-500">{meal.student.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 w-fit ${getStatusColor(
                            meal.status
                          )}`}
                        >
                          {getStatusIcon(meal.status)}
                          <span>{meal.status}</span>
                        </span>
                        {meal.deniedReason && (
                          <p className="text-xs text-red-400 mt-1">{meal.deniedReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {meal.verificationMethod}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {meal.token ? (
                          <span className="text-blue-400">Token: {meal.token.tokenNumber}</span>
                        ) : meal.enrollment ? (
                          <span className="text-green-400">Plan: {meal.enrollment.mealPlan.name}</span>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div>{new Date(meal.requestedAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(meal.requestedAt).toLocaleTimeString()}
                        </div>
                        {meal.completedAt && (
                          <div className="text-xs text-green-400 mt-1">
                            Completed: {new Date(meal.completedAt).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

