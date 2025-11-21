'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle, Users, UtensilsCrossed } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface ServedMeal {
  id: string
  student: {
    name: string
    studentId: string | null
    email: string
  }
  status: string
  requestedAt: string
  approvedAt: string | null
  verificationMethod: string
}

export default function TodaysServedPage() {
  const [meals, setMeals] = useState<ServedMeal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodaysServed()
    const interval = setInterval(fetchTodaysServed, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchTodaysServed = async () => {
    try {
      const res = await fetch('/api/manager/meals?filter=COMPLETED')
      if (res.ok) {
        const data = await res.json()
        // Filter for today's completed meals
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayMeals = data.filter((meal: any) => {
          const mealDate = meal.completedAt 
            ? new Date(meal.completedAt)
            : meal.approvedAt 
            ? new Date(meal.approvedAt)
            : new Date(meal.requestedAt)
          mealDate.setHours(0, 0, 0, 0)
          return mealDate.getTime() === today.getTime() && (meal.status === 'COMPLETED' || meal.status === 'APPROVED')
        })
        setMeals(todayMeals)
      }
    } catch (error) {
      console.error('Error fetching today\'s served meals:', error)
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
          <div className="flex items-center space-x-4">
            <Link
              href="/manager/dashboard"
              className="p-2 border border-white/20 rounded-lg hover:border-green-400/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Today's Served</h1>
              <p className="text-gray-400">List of students served today</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UtensilsCrossed className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Total Meals Served Today</p>
                <p className="text-3xl font-bold text-green-400">{meals.length}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Date</p>
              <p className="text-lg font-semibold text-white">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Meals List */}
        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Meals Served</h2>
          </div>
          <div className="divide-y divide-white/10">
            {meals.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No meals served today yet</p>
              </div>
            ) : (
              meals.map((meal) => (
                <div key={meal.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400 font-semibold">
                          {meal.student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{meal.student.name}</h3>
                        <p className="text-sm text-gray-400">{meal.student.studentId || 'N/A'}</p>
                        <p className="text-xs text-gray-500 mt-1">{meal.student.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-green-400 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-semibold">Served</span>
                      </div>
                      <p className="text-sm text-gray-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(meal.approvedAt || meal.requestedAt)}</span>
                      </p>
                      <span className="mt-2 inline-block px-2 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-400 rounded text-xs">
                        {meal.verificationMethod}
                      </span>
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
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </Layout>
  )
}

