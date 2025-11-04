'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Moon, Sun, User, LogOut, Coins, Menu } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image 
              src="/logo.svg" 
              alt="WheelWise Logo" 
              width={48}
              height={48}
              className="hover:scale-110 transition-transform duration-300"
            />
            <span className="text-xl font-bold text-white">WheelWise</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/spin" className="text-gray-300 hover:text-white transition">
              Spin Wheel
            </Link>
            <Link href="/room" className="text-gray-300 hover:text-white transition">
              Rooms
            </Link>
            <Link href="/wheels" className="text-gray-300 hover:text-white transition">
              Explore
            </Link>
            {session && (
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-300" />
              )}
            </button>

            {/* User Menu */}
            {session ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-500">
                    {session.user?.tokens || 0}
                  </span>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition"
                >
                  <User className="w-5 h-5 text-gray-300" />
                  <span className="text-sm text-gray-300 hidden lg:block">
                    {session.user?.name}
                  </span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-2 hover:bg-slate-800 rounded-lg transition"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold hover:shadow-lg transition"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden py-4 space-y-2 border-t border-slate-800">
            <Link
              href="/wheels"
              className="block px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg transition"
              onClick={() => setMenuOpen(false)}
            >
              Explore
            </Link>
            <Link
              href="/wheel/create"
              className="block px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg transition"
              onClick={() => setMenuOpen(false)}
            >
              Create
            </Link>
            <Link
              href="/room/join"
              className="block px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg transition"
              onClick={() => setMenuOpen(false)}
            >
              Join Room
            </Link>
            <Link
              href="/leaderboard"
              className="block px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg transition"
              onClick={() => setMenuOpen(false)}
            >
              Leaderboard
            </Link>
            {session && (
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg transition"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
