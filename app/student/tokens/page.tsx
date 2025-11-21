'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function StudentTokensPage() {
  const [tokens, setTokens] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tokensRes, enrollmentsRes] = await Promise.all([
        fetch('/api/student/tokens'),
        fetch('/api/student/enrollments'),
      ])

      if (tokensRes.ok) {
        const tokensData = await tokensRes.json()
        setTokens(tokensData)
      }

      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json()
        setEnrollments(enrollmentsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Tokens & Meal Plans</h1>
          <p className="text-gray-400">View your active tokens and meal plan subscriptions</p>
        </div>

        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Dining Tokens</h2>
          </div>
          <div className="divide-y divide-white/10">
            {tokens.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No tokens found</p>
              </div>
            ) : (
              tokens.map((token) => (
                <div key={token.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                        token.status === 'ACTIVE'
                          ? 'bg-green-500/20 border-green-400/30'
                          : token.status === 'USED'
                          ? 'bg-gray-500/20 border-gray-400/30'
                          : 'bg-red-500/20 border-red-400/30'
                      }`}>
                        {token.status === 'ACTIVE' && <CheckCircle className="w-6 h-6 text-green-400" />}
                        {token.status === 'USED' && <XCircle className="w-6 h-6 text-gray-400" />}
                        {token.status === 'EXPIRED' && <XCircle className="w-6 h-6 text-red-400" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Token #{token.tokenNumber}</h3>
                        <p className="text-sm text-gray-400">
                          Purchased: {formatDate(token.purchasedAt)}
                        </p>
                        {token.expiresAt && (
                          <p className="text-sm text-gray-400">
                            Expires: {formatDate(token.expiresAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      token.status === 'ACTIVE'
                        ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                        : token.status === 'USED'
                        ? 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                        : 'bg-red-500/20 text-red-400 border border-red-400/30'
                    }`}>
                      {token.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Meal Plan Enrollments</h2>
          </div>
          <div className="divide-y divide-white/10">
            {enrollments.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No active meal plans</p>
              </div>
            ) : (
              enrollments.map((enrollment) => (
                <div key={enrollment.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{enrollment.mealPlan.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {enrollment.mealPlan.description}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-400">
                        <span>Meals Remaining: <strong className="text-white">{enrollment.mealsRemaining}</strong></span>
                        <span>Start: {formatDate(enrollment.startDate)}</span>
                        <span>End: {formatDate(enrollment.endDate)}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                      enrollment.isActive && enrollment.mealsRemaining > 0
                        ? 'bg-green-500/20 text-green-400 border-green-400/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-400/30'
                    }`}>
                      {enrollment.isActive && enrollment.mealsRemaining > 0 ? 'ACTIVE' : 'INACTIVE'}
                    </span>
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

