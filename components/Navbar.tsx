'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, UserPlus, LogIn, LogOut, Menu, X } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [pathname])

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false)
  }, [pathname])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (error) {
      // Not logged in
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setMobileMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const getDashboardLink = () => {
    if (!user) return null
    const role = user.role?.toLowerCase()
    return `/${role}/dashboard`
  }

  // Don't show navbar on panel pages that already have their own navigation
  const isPanelPage = pathname?.startsWith('/admin/') || 
                     pathname?.startsWith('/manager/') || 
                     pathname?.startsWith('/student/')

  if (isPanelPage) {
    return null // Panel pages have their own navbar in Layout component
  }

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '#about', label: 'About', icon: Home },
    { href: '/enroll', label: 'Enroll', icon: UserPlus },
  ]

  return (
    <header className="fixed top-0 w-full bg-black/80 backdrop-blur-md border-b border-white/5 z-50">
      <nav className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 border border-white/20 rounded-full hover:border-green-400/50 transition-colors"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-black">D</span>
            </div>
            <span className="text-sm sm:text-base lg:text-lg font-bold text-green-400">DINING SYS</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link 
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                      : 'border border-white/20 hover:border-green-400/50 hover:text-green-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 border-2 border-white/20 border-t-green-400 rounded-full animate-spin"></div>
            ) : user ? (
              <>
                {getDashboardLink() && (
                  <Link
                    href={getDashboardLink()}
                    className="px-4 py-2 rounded-full border border-white/20 hover:border-green-400/50 transition-colors text-sm font-semibold"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-full hover:border-red-400/50 transition-colors text-sm font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 ${
                  pathname === '/login'
                    ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                    : 'border border-white/20 hover:border-green-400/50 hover:text-green-400'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {!loading && user && getDashboardLink() && (
              <Link
                href={getDashboardLink()}
                className="p-2 border border-white/20 rounded-full hover:border-green-400/50 transition-colors"
                aria-label="Dashboard"
              >
                <Home className="w-5 h-5" />
              </Link>
            )}
            {loading ? (
              <div className="w-8 h-8 border-2 border-white/20 border-t-green-400 rounded-full animate-spin"></div>
            ) : !user ? (
              <Link
                href="/login"
                className="p-2 border border-white/20 rounded-full hover:border-green-400/50 transition-colors"
                aria-label="Login"
              >
                <LogIn className="w-5 h-5" />
              </Link>
            ) : null}
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

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-2 py-2 border-t border-white/10 mt-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center gap-3 ${
                    isActive
                      ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                      : 'border border-white/10 hover:bg-white/5 hover:border-green-400/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            {user && (
              <>
                {getDashboardLink() && (
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg border border-white/10 hover:bg-white/5 hover:border-green-400/30 font-semibold text-sm transition-colors flex items-center gap-3"
                  >
                    <Home className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-3 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-400 font-semibold text-sm transition-colors flex items-center gap-3 text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            )}
            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center gap-3 ${
                  pathname === '/login'
                    ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                    : 'border border-white/10 hover:bg-white/5 hover:border-green-400/30'
                }`}
              >
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

