'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { Users, Plus, Edit, Trash2, Eye, Search, UtensilsCrossed } from 'lucide-react'

interface Student {
  id: string
  name: string
  studentId: string | null
  email: string
  department?: string
  photo?: string
  idCard?: string
  createdAt: string
}

interface MealPlan {
  id: string
  name: string
  description: string | null
  price: number
  mealCount: number
  durationDays: number
  isActive: boolean
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    department: '',
    password: '',
  })
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null)
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<string>('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchMealPlans()
  }, [])

  const fetchMealPlans = async () => {
    try {
      const res = await fetch('/api/admin/meal-plans')
      if (res.ok) {
        const data = await res.json()
        setMealPlans(data.filter((plan: MealPlan) => plan.isActive))
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        // API returns array directly
        const studentList = Array.isArray(data) ? data.filter((u: any) => u.role === 'STUDENT') : []
        setStudents(studentList)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchStudents()
      }
    } catch (error) {
      console.error('Error deleting student:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingStudent 
        ? `/api/admin/users/${editingStudent.id}`
        : '/api/auth/register'
      
      const method = editingStudent ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'STUDENT',
        }),
      })

      if (res.ok) {
        setShowAddModal(false)
        setEditingStudent(null)
        setFormData({ name: '', studentId: '', email: '', department: '', password: '' })
        fetchStudents()
      }
    } catch (error) {
      console.error('Error saving student:', error)
    }
  }

  const handleAssignMealPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assigningStudent || !selectedMealPlanId) return

    setAssigning(true)
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assigningStudent.id,
          mealPlanId: selectedMealPlanId,
        }),
      })

      if (res.ok) {
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-green-500/20 border border-green-400/50 text-green-400 px-6 py-4 rounded-xl shadow-lg z-50 flex items-center space-x-3'
        successMsg.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="font-semibold">Meal plan assigned successfully!</span>
        `
        document.body.appendChild(successMsg)
        setTimeout(() => successMsg.remove(), 3000)

        setShowAssignModal(false)
        setAssigningStudent(null)
        setSelectedMealPlanId('')
      } else {
        const error = await res.json()
        const errorMsg = error.error || 'Failed to assign meal plan'
        alert(errorMsg)
      }
    } catch (error) {
      console.error('Error assigning meal plan:', error)
      alert('Error assigning meal plan')
    } finally {
      setAssigning(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <h1 className="text-3xl font-bold text-white mb-2">Students</h1>
            <p className="text-gray-400">Manage student accounts</p>
          </div>
          <button
            onClick={() => {
              setEditingStudent(null)
              setFormData({ name: '', studentId: '', email: '', department: '', password: '' })
              setShowAddModal(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Add Student</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50"
          />
        </div>

        {/* Students Table */}
        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Photo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Student ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No students found</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <span className="text-green-400 font-semibold">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">{student.name}</td>
                      <td className="px-6 py-4 text-gray-300">{student.studentId || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-300">{student.email}</td>
                      <td className="px-6 py-4 text-gray-300">{student.department || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setAssigningStudent(student)
                              setSelectedMealPlanId('')
                              setShowAssignModal(true)
                            }}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded transition-colors"
                            title="Assign Meal Plan"
                          >
                            <UtensilsCrossed className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudent(student)
                              setFormData({
                                name: student.name,
                                studentId: student.studentId || '',
                                email: student.email,
                                department: student.department || '',
                                password: '',
                              })
                              setShowAddModal(true)
                            }}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingStudent ? 'Edit Student' : 'Add Student'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Student ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                  />
                </div>
                {!editingStudent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                    />
                  </div>
                )}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingStudent(null)
                    }}
                    className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold"
                  >
                    {editingStudent ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Meal Plan Modal */}
        {showAssignModal && assigningStudent && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black border border-white/20 rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-2">Assign Meal Plan</h2>
              <p className="text-gray-400 mb-4">Assign a meal plan to {assigningStudent.name}</p>
              <form onSubmit={handleAssignMealPlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Select Meal Plan</label>
                  {mealPlans.length === 0 ? (
                    <div className="px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-gray-400 text-center">
                      No active meal plans available. Please create one first.
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedMealPlanId}
                      onChange={(e) => setSelectedMealPlanId(e.target.value)}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
                    >
                      <option value="">-- Select a meal plan --</option>
                      {mealPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - ${plan.price} ({plan.mealCount} meals, {plan.durationDays} days)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {selectedMealPlanId && (
                  <div className="p-4 bg-black/50 border border-white/10 rounded-lg space-y-2">
                    {(() => {
                      const selectedPlan = mealPlans.find((p) => p.id === selectedMealPlanId)
                      return selectedPlan ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Plan:</span>
                            <span className="text-white font-semibold">{selectedPlan.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Price:</span>
                            <span className="text-white font-semibold">${selectedPlan.price}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Meals:</span>
                            <span className="text-white font-semibold">{selectedPlan.mealCount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Duration:</span>
                            <span className="text-white font-semibold">{selectedPlan.durationDays} days</span>
                          </div>
                          {selectedPlan.description && (
                            <div className="pt-2 border-t border-white/10">
                              <p className="text-xs text-gray-400">{selectedPlan.description}</p>
                            </div>
                          )}
                        </>
                      ) : null
                    })()}
                  </div>
                )}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false)
                      setAssigningStudent(null)
                      setSelectedMealPlanId('')
                    }}
                    className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                    disabled={assigning}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning || !selectedMealPlanId || mealPlans.length === 0}
                    className="flex-1 px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assigning ? 'Assigning...' : 'Assign Meal Plan'}
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

