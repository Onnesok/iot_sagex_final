'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react'

interface ReportStats {
  totalMeals: number
  approvedMeals: number
  deniedMeals: number
  pendingMeals: number
  activeStudents: number
  fraudAttempts: number
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<ReportStats | null>(null)

  useEffect(() => {
    fetchReport()
  }, [reportType, selectedDate])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const dateParam = reportType === 'daily' 
        ? selectedDate 
        : selectedDate.substring(0, 7)
      
      const res = await fetch(`/api/admin/reports?type=${reportType}&date=${dateParam}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (type: 'daily' | 'monthly') => {
    setLoading(true)
    try {
      // For now, just show alert. In production, this would generate and download PDF
      alert(`Downloading ${type} report for ${selectedDate}...`)
      // In a real implementation, this would trigger a PDF download
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout role="admin">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
          <p className="text-gray-400">View and download system reports</p>
        </div>

        {/* Report Type Selection */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Select Report Type</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setReportType('daily')}
              className={`p-6 border-2 rounded-xl transition-all ${
                reportType === 'daily'
                  ? 'border-green-400/50 bg-green-500/10'
                  : 'border-white/10 hover:border-green-400/30'
              }`}
            >
              <Calendar className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Daily Report</h3>
              <p className="text-sm text-gray-400">View meals served and activities for a specific day</p>
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`p-6 border-2 rounded-xl transition-all ${
                reportType === 'monthly'
                  ? 'border-green-400/50 bg-green-500/10'
                  : 'border-white/10 hover:border-green-400/30'
              }`}
            >
              <TrendingUp className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Monthly Report</h3>
              <p className="text-sm text-gray-400">View comprehensive statistics for the month</p>
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {reportType === 'daily' ? 'Select Date' : 'Select Month'}
          </label>
          <input
            type={reportType === 'daily' ? 'date' : 'month'}
            value={reportType === 'daily' ? selectedDate : selectedDate.substring(0, 7)}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50"
          />
        </div>

        {/* Report Preview */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Report Preview</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
              </div>
            ) : stats ? (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Total Meals</p>
                  <p className="text-2xl font-bold text-green-400">{stats.totalMeals}</p>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Approved Meals</p>
                  <p className="text-2xl font-bold text-green-400">{stats.approvedMeals}</p>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Denied Meals</p>
                  <p className="text-2xl font-bold text-red-400">{stats.deniedMeals}</p>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Pending Meals</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pendingMeals}</p>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Active Students</p>
                  <p className="text-2xl font-bold text-green-400">{stats.activeStudents}</p>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Fraud Attempts</p>
                  <p className="text-2xl font-bold text-red-400">{stats.fraudAttempts}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => handleDownload('daily')}
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-semibold disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </Layout>
  )
}

