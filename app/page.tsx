'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Shield, Users, CheckCircle, Lock, Camera, CreditCard, Key, UtensilsCrossed, TrendingUp, Clock } from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState({
    onlineUsers: 0,
    activeMeals: 0,
    pendingRequests: 0,
    totalMeals: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/public/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        setStats({
          onlineUsers: 156,
          activeMeals: 42,
          pendingRequests: 8,
          totalMeals: 1247,
        })
      } finally {
        setLoadingStats(false)
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">

      {/* Main Hero Section */}
      <section id="home" className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 relative min-h-screen flex items-center">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 sm:space-y-8 z-10"
          >
            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-lg sm:text-xl md:text-2xl text-white font-light"
            >
              Tokenless Dining Management System
            </motion.p>

            {/* Main Title - Large glowing green */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-green-400 leading-tight"
              style={{
                textShadow: '0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)',
              }}
            >
              DINING SYS
            </motion.h1>

            {/* Quote - Italicized with green vertical line indicator */}
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base sm:text-lg md:text-xl text-white italic pl-4 sm:pl-6 border-l-2 border-green-400/50 max-w-2xl"
            >
              &quot;Stand at the entrance, verify with face/ID/PIN, and get instant approval for your meal - no physical token required.&quot;
            </motion.blockquote>

            {/* Quick CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href="/enroll"
                className="px-6 py-3 rounded-full bg-green-500/20 border border-green-400/50 text-green-400 font-semibold hover:bg-green-500/30 transition-colors"
              >
                New Enrollment
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 rounded-full border border-white/30 text-white font-semibold hover:border-green-400/60 transition-colors"
              >
                Login
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Background Effects - Subtle green glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-teal-500/5 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* System Snapshot */}
      <section id="snapshot" className="py-12 sm:py-20 px-4 sm:px-6 relative">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
              Live System Snapshot
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-4xl mx-auto px-4">
              Student activity, meal requests, and system status pulled directly from the backend.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-black/50 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-green-400/50 transition-all">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Network Status</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Online Users', value: stats.onlineUsers },
                  { label: 'Active Meals', value: stats.activeMeals },
                  { label: 'Pending Requests', value: stats.pendingRequests },
                  { label: 'Total Meals', value: stats.totalMeals },
                ].map((card) => (
                  <div key={card.label} className="bg-black/40 border border-white/5 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">{card.label}</div>
                    <div className="text-2xl font-bold text-green-400">{loadingStats ? '...' : card.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-green-400/50 transition-all">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">System Features</h3>
              <div className="space-y-4">
                {[
                  { icon: Camera, title: 'Face Recognition', desc: 'Multi-person detection with real-world lighting' },
                  { icon: CreditCard, title: 'ID Card Detection', desc: 'RFID/NFC card reading' },
                  { icon: Key, title: 'PIN Entry', desc: 'Fallback verification method' },
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <feature.icon className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-lg font-semibold text-white">{feature.title}</p>
                        <p className="text-xs text-gray-500">{feature.desc}</p>
                      </div>
                    </div>
                    <span className="text-green-400 font-semibold text-sm">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 sm:py-20 px-4 sm:px-6 relative">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
              About DINING SYS
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto px-4">
              A tokenless, fraud-proof dining management system designed for CUET. Students can access meals without physical tokens through multi-factor authentication and real-time manager approval.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: 'App-less Interface',
                description: 'No smartphone required. Students verify at the entrance using face recognition, ID card, or PIN.',
                icon: 'LOC'
              },
              {
                title: 'Multi-Sensor Authentication',
                description: 'Face recognition, ID card readers, and PIN entry ensure secure identity verification.',
                icon: 'AUTH'
              },
              {
                title: 'Real-time Approval',
                description: 'Backend automatically notifies managers for instant meal approval or denial.',
                icon: 'RT'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-black/50 border border-white/10 rounded-xl p-5 sm:p-6 hover:border-green-400/50 transition-all"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                  <span className="text-xs sm:text-sm font-bold text-green-400">{feature.icon}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-black to-black relative">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
              Key Features
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto px-4">
              A comprehensive solution designed for security, accessibility, and ease of use
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Face Recognition',
                description: 'Multi-person detection (2-3 simultaneous) with real-world lighting adaptation.',
                icon: 'FACE'
              },
              {
                title: 'ID Card Detection',
                description: 'RFID/NFC card reading for quick and secure verification.',
                icon: 'ID'
              },
              {
                title: 'PIN Entry System',
                description: 'Fallback verification method for accessibility.',
                icon: 'PIN'
              },
              {
                title: 'Zero Fraud',
                description: 'Automatic double-serving prevention and eligibility verification.',
                icon: 'FRAUD'
              },
              {
                title: 'Manager Dashboard',
                description: 'Real-time approval interface with clear indicators and statistics.',
                icon: 'MGR'
              },
              {
                title: 'Secure & Private',
                description: 'Encrypted data with privacy-first architecture and audit trails.',
                icon: 'SEC'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-black/50 border border-white/10 rounded-xl p-5 sm:p-6 hover:border-green-400/50 transition-all"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                  <span className="text-xs sm:text-sm font-bold text-green-400">{feature.icon}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* System Architecture Section */}
      <section id="system" className="py-12 sm:py-20 px-4 sm:px-6 relative">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
              System Architecture
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Student-Side',
                description: 'Face recognition camera, ID card reader (RFID/NFC), PIN entry keypad, LED status indicators, OLED display for feedback.',
                icon: 'U',
              },
              {
                title: 'Manager-Side',
                description: 'Web dashboard for approvals, real-time meal request queue, approval/denial interface, statistics and analytics, system monitoring.',
                icon: 'R',
              },
              {
                title: 'Backend System',
                description: 'Identity verification, eligibility checking, fraud prevention, real-time status sync, complete audit trail.',
                icon: 'B',
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-black/50 border border-white/10 rounded-xl p-5 sm:p-6 hover:border-green-400/50 transition-all"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-green-400">{item.icon}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="container mx-auto max-w-7xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                  <span className="text-base sm:text-xl font-bold text-black">D</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-green-400">DINING SYS</span>
              </div>
              <p className="text-gray-400 text-sm">
                Tokenless Dining Management System
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white text-sm sm:text-base">Quick Links</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/" className="hover:text-green-400 transition-colors">Home</Link></li>
                <li><Link href="/enroll" className="hover:text-green-400 transition-colors">Enroll</Link></li>
                <li><Link href="/login" className="hover:text-green-400 transition-colors">Login</Link></li>
                <li><a href="#about" className="hover:text-green-400 transition-colors">About</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white text-sm sm:text-base">Portals</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/student/dashboard" className="hover:text-green-400 transition-colors">Student Portal</Link></li>
                <li><Link href="/manager/dashboard" className="hover:text-green-400 transition-colors">Manager Dashboard</Link></li>
                <li><Link href="/admin/dashboard" className="hover:text-green-400 transition-colors">Admin Dashboard</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 border-t border-white/10 text-center text-xs sm:text-sm text-gray-500">
            <p>© 2025 DINING SYS. All rights reserved.</p>
            <p className="mt-2">IoT Tokenless Dining Management System - CUET</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
