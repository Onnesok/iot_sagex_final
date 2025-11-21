'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft, UtensilsCrossed, Calendar, CreditCard } from 'lucide-react'

interface RemainingMealsData {
  mealsRemaining: number
  expiryDate: string | null
  mealPlanName: string | null
}

export default function RemainingMealsPage() {
  const [data, setData] = useState<RemainingMealsData>({
    mealsRemaining: 0,
    expiryDate: null,
    mealPlanName: null,
  })
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])

  useEffect(() => {
    fetchRemainingMeals()
  }, [])

  const fetchRemainingMeals = async () => {
    try {
      const [statsRes, enrollmentsRes, tokensRes] = await Promise.all([
        fetch('/api/student/stats'),
        fetch('/api/student/enrollments'),
        fetch('/api/student/tokens'),
      ])

      if (tokensRes.ok) {
        const tokensData = await tokensRes.json()
        setTokens(tokensData.filter((t: any) => t.status === 'ACTIVE'))
      }

      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json()
        setEnrollments(enrollmentsData)
        const activeEnrollment = enrollmentsData.find((e: any) => e.isActive && e.mealsRemaining > 0)
        if (activeEnrollment) {
          setData({
            mealsRemaining: activeEnrollment.mealsRemaining || 0,
            expiryDate: activeEnrollment.endDate || null,
            mealPlanName: activeEnrollment.mealPlan?.name || null,
          })
        } else if (statsRes.ok) {
          const stats = await statsRes.json()
          // If no active enrollment, show token count
          setData({
            mealsRemaining: stats.activeTokens || 0,
            expiryDate: null,
            mealPlanName: null,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching remaining meals:', error)
    } finally {
      setLoading(false)
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
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/student/dashboard"
              className="p-2 border border-white/20 rounded-lg hover:border-green-400/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Remaining Meals</h1>
              <p className="text-gray-400">Your meal plan balance</p>
            </div>
          </div>
        </div>

        {/* Remaining Meals Card */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-8">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-12 h-12 text-green-400" />
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">Total Meals Available</p>
              <p className="text-6xl font-bold text-green-400 mb-4">{data.mealsRemaining + tokens.length}</p>
              {data.mealPlanName && (
                <p className="text-gray-400">Meal Plan: <span className="text-white font-semibold">{data.mealPlanName}</span></p>
              )}
              {tokens.length > 0 && data.mealPlanName && (
                <p className="text-gray-400 mt-1">Active Tokens: <span className="text-white font-semibold">{tokens.length}</span></p>
              )}
              {tokens.length > 0 && !data.mealPlanName && (
                <p className="text-gray-400">Active Tokens: <span className="text-white font-semibold">{tokens.length}</span></p>
              )}
            </div>

            {data.expiryDate && (
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-center space-x-2 text-gray-400">
                  <Calendar className="w-5 h-5" />
                  <span>Expiry Date:</span>
                  <span className="text-white font-semibold">
                    {new Date(data.expiryDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(data.expiryDate) > new Date() 
                    ? `${Math.ceil((new Date(data.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`
                    : 'Expired'
                  }
                </p>
              </div>
            )}

            {data.mealsRemaining === 0 && (
              <div className="pt-4">
                <p className="text-yellow-400 font-semibold">No meals remaining. Please purchase a new meal plan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Meal Plan Info */}
          {enrollments.length > 0 && (
            <div className="bg-black/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Meal Plan Information</h3>
              <div className="space-y-3 text-sm text-gray-400">
                {enrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="p-3 bg-black/50 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{enrollment.mealPlan.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        enrollment.isActive && enrollment.mealsRemaining > 0
                          ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                      }`}>
                        {enrollment.isActive && enrollment.mealsRemaining > 0 ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Meals Remaining:</span>
                        <span className="text-white font-semibold">{enrollment.mealsRemaining}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Start:</span>
                        <span>{new Date(enrollment.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>End:</span>
                        <span>{new Date(enrollment.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tokens Info */}
          {tokens.length > 0 && (
            <div className="bg-black/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Active Tokens</h3>
              <div className="space-y-3 text-sm text-gray-400">
                {tokens.map((token: any) => (
                  <div key={token.id} className="p-3 bg-black/50 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">Token #{token.tokenNumber}</span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-400/30 rounded text-xs font-semibold">
                        ACTIVE
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Purchased:</span>
                        <span>{new Date(token.purchasedAt).toLocaleDateString()}</span>
                      </div>
                      {token.expiresAt && (
                        <div className="flex justify-between">
                          <span>Expires:</span>
                          <span>{new Date(token.expiresAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-center justify-between">
              <span>Total Meals Available:</span>
              <span className="text-white font-semibold text-lg">
                {data.mealsRemaining + tokens.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <span className={`font-semibold ${(data.mealsRemaining > 0 || tokens.length > 0) ? 'text-green-400' : 'text-red-400'}`}>
                {(data.mealsRemaining > 0 || tokens.length > 0) ? 'Active' : 'Inactive'}
              </span>
            </div>
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

