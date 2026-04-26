"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "../context/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Menu,
} from "lucide-react"

export default function Header() {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()

  const isActive = (path) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          <nav className="hidden md:flex items-center gap-1">
            
            <Link href="/clients">
              <Button 
                variant="ghost" 
                size="sm"
                className={isActive('/clients') ? 'bg-gray-100 dark:bg-gray-800' : ''}
              >
                <Users className="h-4 w-4 mr-2" />
                Clients
              </Button>
            </Link>
            <Link href="/produits">
              <Button 
                variant="ghost" 
                size="sm"
                className={isActive('/produits') ? 'bg-gray-100 dark:bg-gray-800' : ''}
              >
                <Package className="h-4 w-4 mr-2" />
                Produits
              </Button>
            </Link>
            <Link href="/commandes">
              <Button 
                variant="ghost" 
                size="sm"
                className={isActive('/commandes') ? 'bg-gray-100 dark:bg-gray-800' : ''}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Commandes
              </Button>
            </Link>
            {isAdmin() && (
              <Link href="/admin">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={isActive('/admin') ? 'bg-gray-100 dark:bg-gray-800' : ''}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="hidden sm:inline text-sm">{user?.nom || user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.nom || user?.name}</span>
                    <span className="text-xs text-gray-500">{user?.email || user?.post_nom}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}