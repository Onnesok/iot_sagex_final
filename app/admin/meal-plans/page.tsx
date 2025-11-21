'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { UtensilsCrossed, Plus, Edit, Trash2, Eye, DollarSign, Calendar } from 'lucide-react'

interface MealPlan {
  id: string
  name: string
  description: string | null
  price: number
  mealCount: number
  durationDays: number
  isActive: boolean
}

export default function MealPlansPage() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    mealCount: '',
    durationDays: '',
    isActive: true,
  })

  useEffect(() => {
    fetchMealPlans()
  }, [])

  const fetchMealPlans = async () => {
    try {
      const res = await fetch('/api/admin/meal-plans')
      if (res.ok) {
        const data = await res.json()
        setMealPlans(data)
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingPlan 
        ? `/api/admin/meal-plans/${editingPlan.id}`
        : '/api/admin/meal-plans'
      
      const method = editingPlan ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          mealCount: parseInt(formData.mealCount),
          durationDays: parseInt(formData.durationDays),
          isActive: formData.isActive,
        }),
      })

      if (res.ok) {
        setShowModal(false)
        setEditingPlan(null)
        setFormData({
          name: '',
          description: '',
          price: '',
          mealCount: '',
          durationDays: '',
          isActive: true,
        })
        fetchMealPlans()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save meal plan')
      }
    } catch (error) {
      console.error('Error saving meal plan:', error)
      alert('Error saving meal plan')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meal plan?')) return
    
    try {
      const res = await fetch(`/api/admin/meal-plans/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchMealPlans()
      } else {
        alert('Failed to delete meal plan')
      }
    } catch (error) {
      console.error('Error deleting meal plan:', error)
      alert('Error deleting meal plan')
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Meal Plans</h1>
            <p className="text-gray-400">Manage meal plans and pricing</p>
          </div>
          <button
            onClick={() => {
              setEditingPlan(null)
              setFormData({
                name: '',
                description: '',
                price: '',
                mealCount: '',
                durationDays: '',
                isActive: true,
              })
              setShowModal(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Assign Meal Plan</span>
          </button>
        </div>

        {/* Meal Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mealPlans.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-black/50 border border-white/10 rounded-xl">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-20" />
              <p className="text-gray-400">No meal plans found</p>
            </div>
          ) : (
            mealPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-green-400/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">{plan.name}</h3>
                    <p className="text-sm text-gray-400">{plan.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      plan.isActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white font-semibold">${plan.price}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Meals:</span>
                    <span className="text-white font-semibold">{plan.mealCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white font-semibold">{plan.durationDays} days</span>
                  </div>
                </div>
                <div className="flex space-x-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setEditingPlan(plan)
                      setFormData({
                        name: plan.name,
                        description: plan.description || '',
                        price: plan.price.toString(),
                        mealCount: plan.mealCount.toString(),
                        durationDays: plan.durationDays.toString(),
                        isActive: plan.isActive,
                      })
                      setShowModal(true)
                    }}
                    className="flex-1 px-3 py-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors text-sm font-semibold"
                  >
                    Change Plan
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="px-3 py-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingPlan ? 'Edit Meal Plan' : 'Create Meal Plan'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Price *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Meal Count *</label>
                    <input
                      type="number"
                      required
                      value={formData.mealCount}
                      onChange={(e) => setFormData({ ...formData, mealCount: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Duration (Days) *</label>
                  <input
                    type="number"
                    required
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded bg-black/50 border-white/10 text-green-400 focus:ring-green-400"
                  />
                  <label className="text-sm text-gray-400">Active</label>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingPlan(null)
                    }}
                    className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold"
                  >
                    {editingPlan ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

