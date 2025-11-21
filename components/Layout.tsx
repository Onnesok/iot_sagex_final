'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Home, Users, UtensilsCrossed, Shield, UserPlus, FileText, AlertTriangle, Calendar, History, Menu, X } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  role: 'admin' | 'manager' | 'student'
}

export default function Layout({ children, role }: LayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false)
  }, [pathname])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (res.ok) {
        setUser(data.user)
        // Check if user role matches the required role for this panel
        const userRole = data.user?.role?.toLowerCase()
        const requiredRole = role.toLowerCase()
        if (userRole !== requiredRole && userRole !== 'admin') {
          // Admin can access all panels, but managers/students can only access their own
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setMobileMenuOpen(false)
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const navItems = {
    admin: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
      { href: '/admin/students', label: 'Students', icon: Users },
      { href: '/admin/users', label: 'All Users', icon: Users },
      { href: '/admin/meals', label: 'All Meals', icon: UtensilsCrossed },
      { href: '/admin/enrollment', label: 'Enrollment', icon: UserPlus },
      { href: '/admin/meal-plans', label: 'Meal Plans', icon: UtensilsCrossed },
      { href: '/admin/managers', label: 'Managers', icon: Shield },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
      { href: '/admin/fraud-alerts', label: 'Fraud Alerts', icon: AlertTriangle },
    ],
    manager: [
      { href: '/manager/dashboard', label: 'Home', icon: Home },
      { href: '/manager/todays-served', label: 'Today\'s Served', icon: Calendar },
      { href: '/manager/fraud-attempts', label: 'Fraud Attempts', icon: AlertTriangle },
    ],
    student: [
      { href: '/student/dashboard', label: 'Home', icon: Home },
      { href: '/student/meal-history', label: 'Meal History', icon: History },
      { href: '/student/remaining-meals', label: 'Remaining Meals', icon: UtensilsCrossed },
    ],
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link 
              href={`/${role}/dashboard`} 
              className="flex items-center gap-2 flex-shrink-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-black">D</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-green-400 hidden sm:inline">DINING SYS</span>
              <span className="text-sm font-bold text-green-400 sm:hidden">DS</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2 overflow-x-auto">
              {navItems[role].map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                        : 'border border-white/20 hover:border-green-400/50 hover:text-green-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Desktop User Info */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-gray-400 truncate max-w-[150px]">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 border border-white/20 rounded-full hover:border-green-400/50 transition-colors text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button & User Info */}
            <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
              {user?.name && (
                <span className="text-xs text-gray-400 truncate max-w-[80px] sm:max-w-[120px]">
                  {user.name}
                </span>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 border border-white/20 rounded-full hover:border-green-400/50 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              mobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex flex-col gap-2 py-4 border-t border-white/10">
              {navItems[role].map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center gap-3 ${
                      isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                        : 'border border-white/10 hover:bg-white/5 hover:border-green-400/30'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="mt-2 px-4 py-3 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-400 font-semibold text-sm transition-colors flex items-center gap-3 text-left"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-4 sm:py-8">{children}</main>
    </div>
  )
}
