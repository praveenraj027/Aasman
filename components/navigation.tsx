"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Menu, X, Satellite, Globe, BarChart3, Users, Brain, User } from "lucide-react"

interface UserData {
  email: string
  name: string
  role: string
  joinDate: string
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const navItems = [
    { href: "/", label: "Home", icon: Globe },
    { href: "/features", label: "Features", icon: Satellite },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/map", label: "Map", icon: Globe },
    { href: "/forecast", label: "Forecast", icon: Brain },
    { href: "/about", label: "About", icon: Users },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Satellite className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Aasman</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="hidden md:block">
            {user ? (
              <Link href="/profile">
                <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent hover:text-gray-400">
                  <Avatar className="w-6 h-6 bg-primary">
                    <AvatarFallback className="text-white text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="hover:text-gray-400">
                  Get Started
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-card border-b border-border">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            <div className="px-3 py-2">
              {user ? (
                <Link href="/profile" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full bg-transparent flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{user.name}</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
