"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Building2,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Store,
  Sun,
  Moon,
  PackagePlus,
  FileSpreadsheet,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAuth } from "../context/auth-context"
import { useTheme } from "../context/theme-context"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Unités", href: "/admin/unites", icon: LayoutDashboard },
  { name: "Produits", href: "/admin/products", icon: Package },
  { name: "Catégories", href: "/admin/categories", icon: Package },
  { name: "Commandes", href: "/admin/orders", icon: ShoppingCart },
  { name: "Clients", href: "/admin/clients", icon: Users },
  { name: "Fournisseurs", href: "/admin/fournisseurs", icon: Truck }, // Ajouté
  { name: "Approvisionnement", href: "/admin/restocking", icon: PackagePlus },
  { name: "Rapport Stock", href: "/admin/stock-reports", icon: FileSpreadsheet },
  { name: "Tous les Rapports", href: "/admin/reports", icon: FileSpreadsheet },
  { name: "Organizations", href: "/admin/organizations", icon: Building2 },
  { name: "Analyses", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (!isLoading && user && !isAdmin()) {
      router.push("/access-denied")
    }
  }, [user, isLoading, isAdmin, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin()) {
    return null
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex h-full flex-col bg-card", mobile ? "w-full" : "w-64")}>
      <div className="flex h-16 items-center justify-between px-6 border-b">
        <div className="flex items-center gap-2">
          <Store className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">Gestion Stock</span>
        </div>
        {mobile && (
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.name}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11",
                isActive && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => {
                router.push(item.href)
                if (mobile) setSidebarOpen(false)
              }}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Button>
          )
        })}
      </nav>

      <div className="border-t p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-5 w-5" />
              Mode clair
            </>
          ) : (
            <>
              <Moon className="h-5 w-5" />
              Mode sombre
            </>
          )}
        </Button>

        <div className="px-3 py-2 rounded-lg bg-muted/50">
          <p className="text-sm font-medium text-foreground">{user?.nom || user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email || user?.post_nom}</p>
          <p className="text-xs text-emerald-600 mt-1">Administrateur</p>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11"
          onClick={() => router.push("/")}
        >
          <Store className="h-5 w-5" />
          Retour au POS
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col border-r bg-card">
          <Sidebar />
        </div>
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">Gestion Stock</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}