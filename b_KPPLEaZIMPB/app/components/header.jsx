"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "../context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Search,
} from "lucide-react"

export default function Header({ searchQuery = "", setSearchQuery }) {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()

  const isActive = (path) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Titre */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GS</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white hidden sm:inline">
              Gestion Stock
            </span>
          </Link>
          
          {/* Barre de recherche */}
          <div className="relative w-64 mx-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              className="pl-8 bg-muted/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            />
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button 
                variant="ghost" 
                size="sm"
                className={isActive('/') && !isActive('/clients') && !isActive('/produits') && !isActive('/commandes') ? 'bg-gray-100 dark:bg-gray-800' : ''}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Accueil
              </Button>
            </Link>
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