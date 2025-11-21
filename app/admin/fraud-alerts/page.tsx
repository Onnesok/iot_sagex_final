'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { AlertTriangle, Eye, CheckCircle, Clock, User } from 'lucide-react'

interface FraudAlert {
  id: string
  type: 'FACE_MISMATCH' | 'DOUBLE_SERVING' | 'SUSPICIOUS_ENTRY'
  studentId: string
  studentName: string
  description: string
  timestamp: string
  reviewed: boolean
  status: string
}

export default function FraudAlertsPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/admin/fraud-alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
      }
    } catch (error) {
      console.error('Error fetching fraud alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkReviewed = async (alertId: string) => {
    try {
      // Mark as reviewed locally (could add API endpoint for this)
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, reviewed: true } : alert
      ))
    } catch (error) {
      console.error('Error marking alert as reviewed:', error)
    }
  }

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'FACE_MISMATCH':
        return 'Face Mismatch'
      case 'DOUBLE_SERVING':
        return 'Double Serving'
      case 'DENIED_MEAL':
        return 'Denied Meal'
      case 'SUSPICIOUS_ENTRY':
        return 'Suspicious Entry'
      default:
        return type
    }
  }

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'FACE_MISMATCH':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30'
      case 'DOUBLE_SERVING':
        return 'text-red-400 bg-red-500/20 border-red-400/30'
      case 'DENIED_MEAL':
        return 'text-red-400 bg-red-500/20 border-red-400/30'
      case 'SUSPICIOUS_ENTRY':
        return 'text-orange-400 bg-orange-500/20 border-orange-400/30'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-400/30'
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
          <h1 className="text-3xl font-bold text-white mb-2">Fraud Alerts</h1>
          <p className="text-gray-400">Monitor and manage security alerts</p>
        </div>

        {/* Alerts Summary */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-black/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Face Mismatch</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {alerts.filter(a => a.type === 'FACE_MISMATCH' && !a.reviewed).length}
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-yellow-400/20" />
            </div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Double Serving</p>
                <p className="text-3xl font-bold text-red-400">
                  {alerts.filter(a => a.type === 'DOUBLE_SERVING' && !a.reviewed).length}
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-400/20" />
            </div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Suspicious Entries</p>
                <p className="text-3xl font-bold text-orange-400">
                  {alerts.filter(a => a.type === 'SUSPICIOUS_ENTRY' && !a.reviewed).length}
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-orange-400/20" />
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Recent Alerts</h2>
          </div>
          <div className="divide-y divide-white/10">
            {alerts.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No fraud alerts found</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-6 hover:bg-white/5 transition-colors ${
                    !alert.reviewed ? 'bg-red-500/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold border ${getAlertTypeColor(
                            alert.type
                          )}`}
                        >
                          {getAlertTypeLabel(alert.type)}
                        </span>
                        {!alert.reviewed && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold">
                            PENDING
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{alert.studentName}</span>
                          <span className="text-gray-500">({alert.studentId})</span>
                        </div>
                        <p className="text-gray-400">{alert.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-6">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="px-4 py-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors text-sm font-semibold flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      {!alert.reviewed && (
                        <button
                          onClick={() => handleMarkReviewed(alert.id)}
                          className="px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-semibold flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark as Reviewed</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alert Detail Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black border border-white/20 rounded-xl p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Alert Details</h2>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <p className="text-white">{getAlertTypeLabel(selectedAlert.type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Student</label>
                  <p className="text-white">{selectedAlert.studentName} ({selectedAlert.studentId})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <p className="text-white">{selectedAlert.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Timestamp</label>
                  <p className="text-white">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                  >
                    Close
                  </button>
                  {!selectedAlert.reviewed && (
                    <button
                      onClick={() => {
                        handleMarkReviewed(selectedAlert.id)
                        setSelectedAlert(null)
                      }}
                      className="flex-1 px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold"
                    >
                      Mark as Reviewed
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

