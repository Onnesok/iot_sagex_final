'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface MealRecord {
  id: string
  date: string
  time: string
  status: 'SERVED' | 'NOT_SERVED' | 'PENDING' | 'DENIED'
  requestedAt: string
  completedAt?: string | null
  deniedReason?: string | null
}

export default function MealHistoryPage() {
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMealHistory()
  }, [])

  const fetchMealHistory = async () => {
    try {
      const res = await fetch('/api/student/meal-history')
      if (res.ok) {
        const data = await res.json()
        const formattedMeals = (data.meals || data).map((meal: any) => ({
          id: meal.id,
          date: new Date(meal.requestedAt).toLocaleDateString(),
          time: new Date(meal.requestedAt).toLocaleTimeString(),
          status: meal.status === 'APPROVED' || meal.status === 'COMPLETED' ? 'SERVED' : 
                 meal.status === 'DENIED' ? 'NOT_SERVED' : 'PENDING',
          requestedAt: meal.requestedAt,
          completedAt: meal.completedAt,
          deniedReason: meal.deniedReason,
          verificationMethod: meal.verificationMethod,
          token: meal.token,
          enrollment: meal.enrollment,
        }))
        setMeals(formattedMeals)
      }
    } catch (error) {
      console.error('Error fetching meal history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SERVED':
        return (
          <span className="px-3 py-1 bg-green-500/20 border border-green-400/30 text-green-400 rounded-full text-sm font-semibold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Served</span>
          </span>
        )
      case 'NOT_SERVED':
        return (
          <span className="px-3 py-1 bg-red-500/20 border border-red-400/30 text-red-400 rounded-full text-sm font-semibold flex items-center space-x-2">
            <XCircle className="w-4 h-4" />
            <span>Not Served</span>
          </span>
        )
      case 'PENDING':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-400/30 text-yellow-400 rounded-full text-sm font-semibold flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Pending</span>
          </span>
        )
      default:
        return null
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/student/dashboard"
              className="p-2 border border-white/20 rounded-lg hover:border-green-400/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Meal History</h1>
              <p className="text-gray-400">Your past meal records</p>
            </div>
          </div>
        </div>

        {/* Meal History List */}
        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">All Meal Records</h2>
          </div>
          <div className="divide-y divide-white/10">
            {meals.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No meal records found</p>
              </div>
            ) : (
              meals.map((meal) => (
                <div key={meal.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        {getStatusBadge(meal.status)}
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            <span className="font-medium text-gray-300">Date:</span> {meal.date}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            <span className="font-medium text-gray-300">Time:</span> {meal.time}
                          </span>
                        </div>
                        {meal.verificationMethod && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-300">Method:</span>{' '}
                            <span className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-400 rounded text-xs">
                              {meal.verificationMethod}
                            </span>
                          </div>
                        )}
                      </div>
                      {meal.status === 'NOT_SERVED' && meal.deniedReason && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-400/20 rounded-lg">
                          <p className="text-sm text-red-400">
                            <span className="font-medium">Reason:</span> {meal.deniedReason}
                          </p>
                        </div>
                      )}
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
            href="/student/dashboard"
            className="flex items-center space-x-2 px-6 py-3 border border-white/20 rounded-lg hover:border-green-400/50 transition-colors text-white font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>
      </div>
    </Layout>
  )
}

