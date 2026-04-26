"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Eye,
  BarChart3,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { dashboardService, type DashboardStats } from "@/lib/api-services/dashboard"

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")

  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const data = await dashboardService.getStats(timeRange)
      setStats(data)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      toast.error("Erreur", {
        description: "Impossible de charger les données du tableau de bord",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold">Tableau de bord</h1>
        </div>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold">Tableau de bord</h1>
        <div className="flex gap-2">
          {[
            { value: "7d", label: "7 jours" },
            { value: "30d", label: "30 jours" },
            { value: "90d", label: "90 jours" },
          ].map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_sales.toFixed(2)} $</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.sales_growth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={stats.sales_growth >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(stats.sales_growth).toFixed(1)}%
              </span>
              <span className="ml-1">par rapport à la période précédente</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_orders}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.orders_growth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={stats.orders_growth >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(stats.orders_growth).toFixed(1)}%
              </span>
              <span className="ml-1">par rapport à la période précédente</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total clients</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_customers}</div>
            <p className="text-xs text-muted-foreground mt-1">Base de clients active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.low_stock_items}</div>
            <p className="text-xs text-muted-foreground mt-1">Produits à réapprovisionner</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Meilleurs produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.top_products.length > 0 ? (
                stats.top_products.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.nom}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {product.total_ventes.toFixed(2)} $
                          </span>
                          {product.croissance >= 0 ? (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              +{product.croissance}%
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                              {product.croissance}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={(product.total_ventes / stats.top_products[0].total_ventes) * 100} 
                      className="w-20" 
                    />
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucune vente enregistrée</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Commandes récentes</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/commandes")}>
              <Eye className="h-4 w-4 mr-2" />
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_orders.length > 0 ? (
                stats.recent_orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">#{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.client_nom}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{order.total.toFixed(2)} $</p>
                      <Badge variant="secondary" className="text-xs">
                        {order.status === "completed" ? "Terminée" : "En attente"}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucune commande récente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button onClick={() => router.push("/produits")} className="h-20 flex-col gap-2">
              <Package className="h-6 w-6" />
              Ajouter un produit
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 bg-transparent"
              onClick={() => router.push("/commandes")}
            >
              <ShoppingCart className="h-6 w-6" />
              Voir les commandes
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 bg-transparent"
              onClick={() => router.push("/clients")}
            >
              <Users className="h-6 w-6" />
              Gérer les clients
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 bg-transparent"
              onClick={() => router.push("/rapports")}
            >
              <BarChart3 className="h-6 w-6" />
              Voir les rapports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}