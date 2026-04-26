"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  FileSpreadsheet,
  Download,
  Printer,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ArrowUpDown,
  BarChart3,
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Target,
  Trophy,
  Star,
  ShoppingCart,
  Truck,
  RotateCcw,
  History,
  Filter,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { products } from "../../data/products"

// ==================== DONNÉES SIMULÉES ====================

// Données de ventes journalières avec dates réelles
const generateDailySales = (startDate, endDate) => {
  const sales = []
  const currentDate = new Date(startDate)
  const end = new Date(endDate)
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0]
    const dayName = currentDate.toLocaleDateString("fr-FR", { weekday: "long" })
    // Variation selon le jour de semaine
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
    const baseRevenue = isWeekend ? 1800 : 1200
    
    sales.push({
      date: dateStr,
      dayName,
      revenue: Math.floor(Math.random() * 800) + baseRevenue,
      transactions: Math.floor(Math.random() * 50) + (isWeekend ? 40 : 25),
      paymentMethods: {
        cash: Math.floor(Math.random() * 30) + 10,
        card: Math.floor(Math.random() * 40) + 15,
        mobile: Math.floor(Math.random() * 20) + 5,
      },
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return sales
}

// Données de ventes par produit (filtrées par date)
const generateProductSales = (startDate, endDate) => {
  return products.map((product) => {
    const daysInRange = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    const avgDailySales = Math.random() * 5 + 1
    const quantitySold = Math.floor(avgDailySales * daysInRange * (Math.random() * 1.5 + 0.5))
    return {
      ...product,
      quantitySold: Math.min(quantitySold, 500),
      revenue: Math.floor(quantitySold * product.price * (Math.random() * 0.8 + 0.6)),
      turnoverRate: (avgDailySales * 30 / (Math.random() * 100 + 20)).toFixed(2),
      lastSaleDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    }
  })
}

// Données historiques de ventes par période
const generatePeriodSales = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  
  // Calcul des totaux sur la période
  const totalRevenue = Math.floor(Math.random() * 100000) + 20000
  const totalTransactions = Math.floor(Math.random() * 2000) + 400
  
  // Génération des données par semaine
  const weeks = []
  let currentWeekStart = new Date(start)
  let weekIndex = 1
  while (currentWeekStart <= end) {
    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weeks.push({
      week: `Semaine ${weekIndex}`,
      revenue: Math.floor(Math.random() * 15000) + 5000,
      transactions: Math.floor(Math.random() * 300) + 100,
      previousYear: Math.floor(Math.random() * 12000) + 4000,
    })
    currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    weekIndex++
  }
  
  return {
    totalRevenue,
    totalTransactions,
    averageBasket: (totalRevenue / totalTransactions).toFixed(2),
    weekly: weeks.slice(0, 4),
    daily: generateDailySales(startDate, endDate),
  }
}

// Données de ventes par vendeur
const SALESPEOPLE = [
  { id: "V001", name: "Sophie Martin", role: "Caissière", hireDate: "2023-01-15" },
  { id: "V002", name: "Thomas Bernard", role: "Vendeur", hireDate: "2023-03-20" },
  { id: "V003", name: "Julie Petit", role: "Caissière", hireDate: "2023-06-10" },
  { id: "V004", name: "Nicolas Durand", role: "Vendeur senior", hireDate: "2022-11-01" },
]

const generateSalesBySeller = (startDate, endDate) => {
  const daysInRange = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
  return SALESPEOPLE.map((seller) => ({
    ...seller,
    salesThisMonth: Math.floor(Math.random() * 15000 * (daysInRange / 30)) + 3000,
    transactionsCount: Math.floor(Math.random() * 300 * (daysInRange / 30)) + 50,
    averageBasket: Math.floor(Math.random() * 80) + 20,
    satisfactionScore: (Math.random() * 2 + 3).toFixed(1),
    dailyHours: Math.floor(Math.random() * 4) + 6,
    monthlyObjective: 10000,
  }))
}

// Données d'inventaire avec écarts
const generateInventoryData = () => {
  return products.map((product, index) => {
    const theoreticalStock = Math.floor(Math.random() * 150) + 20
    const actualStock = theoreticalStock - Math.floor(Math.random() * 10) + Math.floor(Math.random() * 5)
    const difference = actualStock - theoreticalStock
    return {
      ...product,
      sku: `SKU-${String(index + 1).padStart(4, "0")}`,
      theoreticalStock,
      actualStock,
      difference,
      differenceValue: Math.abs(difference) * product.price * 0.6,
      lastInventoryDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      stockValue: actualStock * product.price * 0.6,
    }
  })
}

// Données de rupture de stock
const generateOutOfStockData = () => {
  return products.slice(0, 8).map((product, index) => ({
    ...product,
    sku: `SKU-${String(index + 1).padStart(4, "0")}`,
    outOfStockSince: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    outageDuration: Math.floor(Math.random() * 14) + 1,
    expectedRestock: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    lostRevenue: Math.floor(Math.random() * 500) + 50,
  }))
}

// Données des produits à réassortir
const generateRestockProducts = () => {
  return products.slice(0, 12).map((product, index) => ({
    ...product,
    sku: `SKU-${String(index + 1).padStart(4, "0")}`,
    currentStock: Math.floor(Math.random() * 15) + 1,
    minStock: 10,
    maxStock: 100,
    reorderPoint: 15,
    suggestedOrder: Math.floor(Math.random() * 50) + 20,
    supplier: ["Fournisseur A", "Fournisseur B", "Fournisseur C"][Math.floor(Math.random() * 3)],
    leadTime: Math.floor(Math.random() * 7) + 2,
  })).filter(p => p.currentStock <= p.reorderPoint)
}

// Données des invendus
const generateSlowMovingProducts = () => {
  return products.slice(3, 10).map((product, index) => ({
    ...product,
    sku: `SKU-${String(index + 4).padStart(4, "0")}`,
    stockQuantity: Math.floor(Math.random() * 80) + 20,
    monthlySales: Math.floor(Math.random() * 10) + 1,
    daysInStock: Math.floor(Math.random() * 180) + 60,
    turnoverRate: (Math.random() * 0.5).toFixed(2),
    stockValue: Math.floor(Math.random() * 500) + 100,
    suggestedDiscount: Math.floor(Math.random() * 40) + 10,
  }))
}

// Données clients
const generateCustomerData = () => {
  const loyalCustomers = []
  for (let i = 1; i <= 25; i++) {
    loyalCustomers.push({
      id: `C${String(i).padStart(4, "0")}`,
      name: `Client ${i}`,
      email: `client${i}@email.com`,
      registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      totalSpent: Math.floor(Math.random() * 5000) + 100,
      purchaseCount: Math.floor(Math.random() * 50) + 5,
      lastPurchase: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      averageBasket: Math.floor(Math.random() * 150) + 30,
      isLoyal: Math.random() > 0.5,
    })
  }
  return loyalCustomers
}

// Données des entrées/sorties de stock
const generateStockMovements = (startDate, endDate) => {
  const movements = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysRange = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  
  for (let i = 0; i < Math.min(50, daysRange * 2); i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + Math.floor(Math.random() * daysRange))
    movements.push({
      id: `MV${String(i + 1).padStart(4, "0")}`,
      date: date.toISOString().split("T")[0],
      product: products[Math.floor(Math.random() * products.length)].name,
      sku: `SKU-${String(Math.floor(Math.random() * 20) + 1).padStart(4, "0")}`,
      type: Math.random() > 0.6 ? "entrée" : "sortie",
      quantity: Math.floor(Math.random() * 50) + 1,
      supplier: ["Fournisseur A", "Fournisseur B", "Fournisseur C"][Math.floor(Math.random() * 3)],
      user: ["Sophie M.", "Thomas B.", "Julie P.", "Nicolas D."][Math.floor(Math.random() * 4)],
    })
  }
  return movements.sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Données des objectifs
const generateObjectives = () => {
  return [
    { id: 1, type: "Collectif", period: "Janvier 2024", objective: 50000, achieved: 48750, percentage: 97.5 },
    { id: 2, type: "Collectif", period: "Février 2024", objective: 52000, achieved: 53100, percentage: 102.1 },
    { id: 3, type: "Collectif", period: "Mars 2024", objective: 55000, achieved: 56200, percentage: 102.2 },
    { id: 4, type: "Collectif", period: "Avril 2024", objective: 58000, achieved: 54900, percentage: 94.7 },
    { id: 5, type: "Collectif", period: "Mai 2024", objective: 60000, achieved: 62800, percentage: 104.7 },
  ]
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function ShopReportsPage() {
  // État pour les dates
  const [dateRangeType, setDateRangeType] = useState("30days")
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date
  })
  const [endDate, setEndDate] = useState(new Date())
  
  // États des filtres
  const [selectedReport, setSelectedReport] = useState("daily-sales")
  const [periodFilter, setPeriodFilter] = useState("week")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sellerFilter, setSellerFilter] = useState("all")
  const [sortBy, setSortBy] = useState("revenue")
  const [sortOrder, setSortOrder] = useState("desc")
  const [selectedSeller, setSelectedSeller] = useState(null)

  // Mise à jour des dates selon le type de plage
  const updateDateRange = (type) => {
    const today = new Date()
    const newStart = new Date()
    switch(type) {
      case "today":
        newStart.setHours(0, 0, 0, 0)
        setStartDate(newStart)
        setEndDate(today)
        break
      case "yesterday":
        newStart.setDate(today.getDate() - 1)
        newStart.setHours(0, 0, 0, 0)
        setStartDate(newStart)
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        setEndDate(yesterday)
        break
      case "7days":
        newStart.setDate(today.getDate() - 7)
        setStartDate(newStart)
        setEndDate(today)
        break
      case "30days":
        newStart.setDate(today.getDate() - 30)
        setStartDate(newStart)
        setEndDate(today)
        break
      case "90days":
        newStart.setDate(today.getDate() - 90)
        setStartDate(newStart)
        setEndDate(today)
        break
      case "custom":
        // Garde les dates actuelles
        break
    }
    setDateRangeType(type)
  }

  // Génération des données selon l'intervalle de dates
  const dailySales = useMemo(() => generateDailySales(startDate, endDate), [startDate, endDate])
  const productSales = useMemo(() => generateProductSales(startDate, endDate), [startDate, endDate])
  const salesBySeller = useMemo(() => generateSalesBySeller(startDate, endDate), [startDate, endDate])
  const periodSales = useMemo(() => generatePeriodSales(startDate, endDate), [startDate, endDate])
  const stockMovements = useMemo(() => generateStockMovements(startDate, endDate), [startDate, endDate])
  
  // Données statiques (indépendantes des dates)
  const inventoryData = useMemo(() => generateInventoryData(), [])
  const outOfStockData = useMemo(() => generateOutOfStockData(), [])
  const restockProducts = useMemo(() => generateRestockProducts(), [])
  const slowMovingProducts = useMemo(() => generateSlowMovingProducts(), [])
  const customerData = useMemo(() => generateCustomerData(), [])
  const objectives = useMemo(() => generateObjectives(), [])

  // Calculs pour les ventes
  const totalRevenue = periodSales.totalRevenue
  const totalTransactions = periodSales.totalTransactions
  const avgBasket = periodSales.averageBasket
  
  // Calculs pour la journée actuelle
  const todaySales = dailySales[dailySales.length - 1]
  const todayAvgBasket = todaySales ? (todaySales.revenue / todaySales.transactions).toFixed(2) : 0
  const totalPaymentMethods = todaySales ? Object.values(todaySales.paymentMethods).reduce((a, b) => a + b, 0) : 0

  // Ventes filtrées par catégorie
  const filteredProductSales = useMemo(() => {
    let result = [...productSales]
    if (categoryFilter !== "all") {
      result = result.filter(p => p.category === categoryFilter)
    }
    result.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      if (sortOrder === "desc") return bVal - aVal
      return aVal - bVal
    })
    return result
  }, [productSales, categoryFilter, sortBy, sortOrder])

  // Top et flop ventes
  const topSellers = useMemo(() => [...productSales].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5), [productSales])
  const flopSellers = useMemo(() => [...productSales].sort((a, b) => a.quantitySold - b.quantitySold).slice(0, 5), [productSales])

  // Ventes par catégorie
  const salesByCategory = useMemo(() => {
    const categories = {}
    productSales.forEach(p => {
      if (!categories[p.category]) {
        categories[p.category] = { revenue: 0, quantity: 0 }
      }
      categories[p.category].revenue += p.revenue
      categories[p.category].quantity += p.quantitySold
    })
    return categories
  }, [productSales])

  // Ventes filtrées par vendeur
  const filteredSellerSales = useMemo(() => {
    if (sellerFilter === "all") return salesBySeller
    return salesBySeller.filter(s => s.id === sellerFilter)
  }, [salesBySeller, sellerFilter])

  // Statistiques clients
  const loyalCustomers = customerData.filter(c => c.isLoyal)
  const newCustomers = customerData.filter(c => new Date(c.registrationDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const regularCustomers = customerData.filter(c => !c.isLoyal && new Date(c.registrationDate) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

  // Totaux inventaire
  const inventoryTotals = useMemo(() => {
    const totalTheoretical = inventoryData.reduce((sum, p) => sum + p.theoreticalStock, 0)
    const totalActual = inventoryData.reduce((sum, p) => sum + p.actualStock, 0)
    const totalDifference = totalActual - totalTheoretical
    const totalValue = inventoryData.reduce((sum, p) => sum + p.stockValue, 0)
    return { totalTheoretical, totalActual, totalDifference, totalValue }
  }, [inventoryData])

  const handlePrint = () => window.print()
  
  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,"
    
    if (selectedReport === "daily-sales") {
      csvContent += "Date,CA,Transactions,Panier Moyen,Espèces,Carte,Mobile\n"
      dailySales.forEach(sale => {
        csvContent += `${sale.date},${sale.revenue},${sale.transactions},${(sale.revenue / sale.transactions).toFixed(2)},${sale.paymentMethods.cash},${sale.paymentMethods.card},${sale.paymentMethods.mobile}\n`
      })
    } else if (selectedReport === "product-sales") {
      csvContent += "Produit,Catégorie,Quantité Vendue,Chiffre d'Affaires,Taux de Rotation\n"
      filteredProductSales.forEach(p => {
        csvContent += `${p.name},${p.category},${p.quantitySold},${p.revenue},${p.turnoverRate}\n`
      })
    } else if (selectedReport === "inventory") {
      csvContent += "SKU,Produit,Stock Théorique,Stock Réel,Écart,Valeur Stock\n"
      inventoryData.forEach(p => {
        csvContent += `${p.sku},${p.name},${p.theoreticalStock},${p.actualStock},${p.difference},${p.stockValue.toFixed(2)}\n`
      })
    }
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `rapport_${selectedReport}_${format(startDate, "yyyy-MM-dd")}_${format(endDate, "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Composant de carte statistique
  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const formatDateRange = () => {
    if (dateRangeType === "today") return "Aujourd'hui"
    if (dateRangeType === "yesterday") return "Hier"
    if (dateRangeType === "7days") return "7 derniers jours"
    if (dateRangeType === "30days") return "30 derniers jours"
    if (dateRangeType === "90days") return "90 derniers jours"
    if (dateRangeType === "custom") return `Du ${format(startDate, "dd/MM/yyyy")} au ${format(endDate, "dd/MM/yyyy")}`
    return `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`
  }

  const getPeriodData = () => {
    switch (periodFilter) {
      case "week": return periodSales.daily?.slice(-7) || []
      case "month": return periodSales.weekly || []
      default: return periodSales.daily || []
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rapports de la Boutique</h1>
          <p className="text-muted-foreground">
            Période : {formatDateRange()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Sélecteur de période avec DatePicker */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Période :</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={dateRangeType === "today" ? "default" : "outline"} 
                size="sm"
                onClick={() => updateDateRange("today")}
              >
                Aujourd'hui
              </Button>
              <Button 
                variant={dateRangeType === "yesterday" ? "default" : "outline"} 
                size="sm"
                onClick={() => updateDateRange("yesterday")}
              >
                Hier
              </Button>
              <Button 
                variant={dateRangeType === "7days" ? "default" : "outline"} 
                size="sm"
                onClick={() => updateDateRange("7days")}
              >
                7 jours
              </Button>
              <Button 
                variant={dateRangeType === "30days" ? "default" : "outline"} 
                size="sm"
                onClick={() => updateDateRange("30days")}
              >
                30 jours
              </Button>
              <Button 
                variant={dateRangeType === "90days" ? "default" : "outline"} 
                size="sm"
                onClick={() => updateDateRange("90days")}
              >
                90 jours
              </Button>
            </div>

            {/* DatePicker personnalisé */}
            <div className="flex items-center gap-2 ml-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(startDate, "dd MMM yyyy", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date)
                        setDateRangeType("custom")
                      }
                    }}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">→</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(endDate, "dd MMM yyyy", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date)
                        setDateRangeType("custom")
                      }
                    }}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dateRangeType === "custom" && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => updateDateRange("30days")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cartes de résumé de la période */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Chiffre d'Affaires" 
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatCard 
          title="Transactions" 
          value={totalTransactions.toLocaleString()}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard 
          title="Panier Moyen" 
          value={`$${avgBasket}`}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard 
          title="Jours dans période" 
          value={`${Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))} jours`}
          icon={Calendar}
          color="bg-amber-500"
        />
      </div>

      {/* Onglets principaux */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-4">
        <TabsList className="print:hidden flex flex-wrap h-auto">
          {/* Ventes */}
          <TabsTrigger value="daily-sales" className="text-xs md:text-sm">
            <ShoppingCart className="h-4 w-4 mr-1" />
            Ventes Journalières
          </TabsTrigger>
          <TabsTrigger value="product-sales" className="text-xs md:text-sm">
            <Package className="h-4 w-4 mr-1" />
            Ventes par Produit
          </TabsTrigger>
          <TabsTrigger value="period-sales" className="text-xs md:text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            Ventes par Période
          </TabsTrigger>
          <TabsTrigger value="top-flop" className="text-xs md:text-sm">
            <Trophy className="h-4 w-4 mr-1" />
            Top/Flop
          </TabsTrigger>
          <TabsTrigger value="category-sales" className="text-xs md:text-sm">
            <BarChart3 className="h-4 w-4 mr-1" />
            Par Catégorie
          </TabsTrigger>
          <TabsTrigger value="seller-sales" className="text-xs md:text-sm">
            <Users className="h-4 w-4 mr-1" />
            Par Vendeur
          </TabsTrigger>
          {/* Stocks */}
          <TabsTrigger value="inventory" className="text-xs md:text-sm">
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Inventaire
          </TabsTrigger>
          <TabsTrigger value="out-of-stock" className="text-xs md:text-sm">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Ruptures
          </TabsTrigger>
          <TabsTrigger value="restock" className="text-xs md:text-sm">
            <Truck className="h-4 w-4 mr-1" />
            À Réassortir
          </TabsTrigger>
          <TabsTrigger value="slow-moving" className="text-xs md:text-sm">
            <RotateCcw className="h-4 w-4 mr-1" />
            Invendus
          </TabsTrigger>
          <TabsTrigger value="movements" className="text-xs md:text-sm">
            <History className="h-4 w-4 mr-1" />
            Mouvements
          </TabsTrigger>
          {/* Clients */}
          <TabsTrigger value="customers" className="text-xs md:text-sm">
            <Users className="h-4 w-4 mr-1" />
            Clients
          </TabsTrigger>
          {/* Personnel */}
          <TabsTrigger value="personnel" className="text-xs md:text-sm">
            <Clock className="h-4 w-4 mr-1" />
            Personnel
          </TabsTrigger>
        </TabsList>

        {/* ==================== 1. RAPPORTS DE VENTES ==================== */}

        {/* Rapport Journalier des Ventes */}
        <TabsContent value="daily-sales">
          <Card>
            <CardHeader>
              <CardTitle>Rapport Journalier des Ventes</CardTitle>
              <CardDescription>
                Chiffre d'affaires, nombre de transactions, panier moyen et moyens de paiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard 
                  title="Chiffre d'Affaires (total)" 
                  value={`$${totalRevenue.toLocaleString()}`}
                  icon={DollarSign}
                  color="bg-emerald-500"
                />
                <StatCard 
                  title="Nombre de Transactions" 
                  value={totalTransactions.toLocaleString()}
                  icon={ShoppingCart}
                  color="bg-blue-500"
                />
                <StatCard 
                  title="Panier Moyen" 
                  value={`$${avgBasket}`}
                  icon={TrendingUp}
                  color="bg-purple-500"
                />
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Moyens de Paiement (moyenne/jour)</p>
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Espèces</span>
                        <span className="font-semibold">
                          {Math.round(dailySales.reduce((s, d) => s + d.paymentMethods.cash, 0) / dailySales.length)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Carte Bancaire</span>
                        <span className="font-semibold">
                          {Math.round(dailySales.reduce((s, d) => s + d.paymentMethods.card, 0) / dailySales.length)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Mobile/PayLib</span>
                        <span className="font-semibold">
                          {Math.round(dailySales.reduce((s, d) => s + d.paymentMethods.mobile, 0) / dailySales.length)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <h3 className="font-semibold mb-3">Détail par jour</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Jour</TableHead>
                      <TableHead className="text-right">CA</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Panier Moyen</TableHead>
                      <TableHead className="text-right">Espèces</TableHead>
                      <TableHead className="text-right">Carte</TableHead>
                      <TableHead className="text-right">Mobile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySales.map((sale) => (
                      <TableRow key={sale.date}>
                        <TableCell>{sale.date}</TableCell>
                        <TableCell className="capitalize">{sale.dayName}</TableCell>
                        <TableCell className="text-right">${sale.revenue}</TableCell>
                        <TableCell className="text-right">{sale.transactions}</TableCell>
                        <TableCell className="text-right">${(sale.revenue / sale.transactions).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{sale.paymentMethods.cash}</TableCell>
                        <TableCell className="text-right">{sale.paymentMethods.card}</TableCell>
                        <TableCell className="text-right">{sale.paymentMethods.mobile}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rapport des ventes par produit */}
        <TabsContent value="product-sales">
          <Card>
            <CardHeader>
              <CardTitle>Ventes par Produit / Référence</CardTitle>
              <CardDescription>Quantités vendues, chiffre d'affaires et taux de rotation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4 print:hidden">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes Catégories</SelectItem>
                    <SelectItem value="food">Alimentation</SelectItem>
                    <SelectItem value="drinks">Boissons</SelectItem>
                    <SelectItem value="desserts">Desserts</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quantitySold">Quantité Vendue</SelectItem>
                    <SelectItem value="revenue">Chiffre d'Affaires</SelectItem>
                    <SelectItem value="turnoverRate">Taux de Rotation</SelectItem>
                    <SelectItem value="name">Nom</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Quantité Vendue</TableHead>
                      <TableHead className="text-right">Chiffre d'Affaires</TableHead>
                      <TableHead className="text-center">Taux de Rotation</TableHead>
                      <TableHead>Dernière Vente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProductSales.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="capitalize">{product.category}</TableCell>
                        <TableCell className="text-right font-semibold">{product.quantitySold}</TableCell>
                        <TableCell className="text-right">${product.revenue.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={parseFloat(product.turnoverRate) > 1.5 ? "default" : "secondary"}>
                            {product.turnoverRate}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.lastSaleDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rapport des ventes par période */}
        <TabsContent value="period-sales">
          <Card>
            <CardHeader>
              <CardTitle>Ventes par Période</CardTitle>
              <CardDescription>Évolution et comparaison sur la période sélectionnée</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 print:hidden">
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Par Jour (7j)</SelectItem>
                    <SelectItem value="month">Par Semaine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Période</TableHead>
                      <TableHead className="text-right">Chiffre d'Affaires</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      {periodFilter !== "day" && <TableHead className="text-right">N-1</TableHead>}
                      {periodFilter !== "day" && <TableHead className="text-center">Évolution</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPeriodData().map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.dayName || item.week || `Jour ${idx + 1}`}</TableCell>
                        <TableCell className="text-right font-medium">${item.revenue?.toLocaleString() || item.revenue}</TableCell>
                        <TableCell className="text-right">{item.transactions}</TableCell>
                        {periodFilter !== "day" && (
                          <>
                            <TableCell className="text-right">${item.previousYear?.toLocaleString() || "-"}</TableCell>
                            <TableCell className="text-center">
                              {item.previousYear && (
                                <Badge className={item.revenue > item.previousYear ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                                  {((item.revenue - item.previousYear) / item.previousYear * 100).toFixed(1)}%
                                </Badge>
                              )}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Résumé période */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Synthèse de la période</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">CA Total</p>
                    <p className="text-xl font-bold">${totalRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-xl font-bold">{totalTransactions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Panier Moyen</p>
                    <p className="text-xl font-bold">${avgBasket}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CA moyen/jour</p>
                    <p className="text-xl font-bold">${Math.round(totalRevenue / dailySales.length).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top et Flop ventes */}
        <TabsContent value="top-flop">
          <Card>
            <CardHeader>
              <CardTitle>Meilleures et Pires Ventes</CardTitle>
              <CardDescription>Top 5 des produits les plus vendus et les moins performants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold">Top Sellers</h3>
                  </div>
                  <div className="space-y-3">
                    {topSellers.map((product, idx) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-emerald-600">#{idx + 1}</span>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{product.quantitySold} vendus</p>
                          <p className="text-sm">${product.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold">Flop Sellers</h3>
                  </div>
                  <div className="space-y-3">
                    {flopSellers.map((product, idx) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-red-600">#{idx + 1}</span>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{product.quantitySold} vendus</p>
                          <p className="text-sm">${product.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ventes par catégorie */}
        <TabsContent value="category-sales">
          <Card>
            <CardHeader>
              <CardTitle>Ventes par Catégorie</CardTitle>
              <CardDescription>Répartition des ventes par catégorie de produit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(salesByCategory).map(([category, data]) => (
                  <Card key={category}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold capitalize">{category}</p>
                        <Badge variant="outline">{((data.revenue / productSales.reduce((s, p) => s + p.revenue, 0)) * 100).toFixed(0)}%</Badge>
                      </div>
                      <p className="text-2xl font-bold">${data.revenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{data.quantity} unités vendues</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ventes par vendeur */}
        <TabsContent value="seller-sales">
          <Card>
            <CardHeader>
              <CardTitle>Ventes par Vendeur/Caissier</CardTitle>
              <CardDescription>Performances individuelles sur la période</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 print:hidden">
                <Select value={sellerFilter} onValueChange={setSellerFilter}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Tous les vendeurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les vendeurs</SelectItem>
                    {SALESPEOPLE.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {filteredSellerSales.map((seller) => (
                  <Card key={seller.id} className="cursor-pointer hover:shadow-md transition" onClick={() => setSelectedSeller(selectedSeller === seller.id ? null : seller.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{seller.name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm">{seller.satisfactionScore}</span>
                        </div>
                      </div>
                      <p className="text-xl font-bold">${seller.salesThisMonth.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{seller.transactionsCount} transactions</p>
                      <p className="text-sm">Panier moyen: ${seller.averageBasket}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedSeller && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h3 className="font-semibold mb-3">Détails</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {salesBySeller.find(s => s.id === selectedSeller) && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Ventes sur période</p>
                          <p className="text-lg font-bold">${salesBySeller.find(s => s.id === selectedSeller)?.salesThisMonth.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Objectif mensuel</p>
                          <p className="text-lg font-bold">${salesBySeller.find(s => s.id === selectedSeller)?.monthlyObjective.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Atteinte</p>
                          <p className="text-lg font-bold">{((salesBySeller.find(s => s.id === selectedSeller)?.salesThisMonth / 10000) * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Heures/jour moy.</p>
                          <p className="text-lg font-bold">{salesBySeller.find(s => s.id === selectedSeller)?.dailyHours}h</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== 2. RAPPORTS DE STOCKS (identiques à avant) ==================== */}
        
        {/* Rapport d'inventaire */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Rapport d'Inventaire</CardTitle>
              <CardDescription>Stock théorique vs réel, écarts et valeur du stock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Stock Théorique" value={inventoryTotals.totalTheoretical} icon={Package} color="bg-blue-500" />
                <StatCard title="Stock Réel" value={inventoryTotals.totalActual} icon={BarChart3} color="bg-emerald-500" />
                <StatCard title="Écart" value={inventoryTotals.totalDifference > 0 ? `+${inventoryTotals.totalDifference}` : inventoryTotals.totalDifference} icon={AlertTriangle} color={inventoryTotals.totalDifference !== 0 ? "bg-amber-500" : "bg-gray-500"} />
                <StatCard title="Valeur du Stock" value={`$${inventoryTotals.totalValue.toFixed(0)}`} icon={DollarSign} color="bg-purple-500" />
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">Théorique</TableHead>
                      <TableHead className="text-right">Réel</TableHead>
                      <TableHead className="text-right">Écart</TableHead>
                      <TableHead className="text-right">Valeur</TableHead>
                      <TableHead>Dernier Inventaire</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className="text-right">{product.theoreticalStock}</TableCell>
                        <TableCell className="text-right font-medium">{product.actualStock}</TableCell>
                        <TableCell className="text-right">
                          <span className={product.difference !== 0 ? (product.difference > 0 ? "text-emerald-600" : "text-red-600") : ""}>
                            {product.difference > 0 ? `+${product.difference}` : product.difference}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">${product.stockValue.toFixed(2)}</TableCell>
                        <TableCell>{product.lastInventoryDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ruptures de stock */}
        <TabsContent value="out-of-stock">
          <Card>
            <CardHeader>
              <CardTitle>Ruptures de Stock</CardTitle>
              <CardDescription>Produits manquants et durée de rupture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {outOfStockData.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 border-red-300 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Rupture depuis</p>
                        <p className="font-semibold text-red-600">{product.outOfStockSince} ({product.outageDuration} jours)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Réapro. prévu</p>
                        <p className="font-semibold">{product.expectedRestock}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">CA perdu estimé</p>
                        <p className="font-semibold">${product.lostRevenue}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Produits à réassortir */}
        <TabsContent value="restock">
          <Card>
            <CardHeader>
              <CardTitle>Produits à Réassortir</CardTitle>
              <CardDescription>Seuil d'alerte et commandes suggérées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Stock Actuel</TableHead>
                      <TableHead className="text-center">Seuil Alerte</TableHead>
                      <TableHead className="text-center">Stock Mini</TableHead>
                      <TableHead className="text-right">Commande Suggérée</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead className="text-center">Délai (j)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-amber-600 font-bold">{product.currentStock}</span>
                        </TableCell>
                        <TableCell className="text-center">{product.reorderPoint}</TableCell>
                        <TableCell className="text-center">{product.minStock}</TableCell>
                        <TableCell className="text-right font-semibold">{product.suggestedOrder}</TableCell>
                        <TableCell>{product.supplier}</TableCell>
                        <TableCell className="text-center">{product.leadTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invendus */}
        <TabsContent value="slow-moving">
          <Card>
            <CardHeader>
              <CardTitle>Produits à Rotation Lente (Invendus)</CardTitle>
              <CardDescription>Produits stockés depuis longtemps avec faible rotation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slowMovingProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Stock</p>
                        <p className="font-bold">{product.stockQuantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Ventes/mois</p>
                        <p className="font-bold text-amber-600">{product.monthlySales}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Jours en stock</p>
                        <p className="font-bold">{product.daysInStock}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Valeur</p>
                        <p className="font-bold">${product.stockValue}</p>
                      </div>
                      <div>
                        <Badge className="bg-orange-100 text-orange-700">Promo suggérée: -{product.suggestedDiscount}%</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mouvements de stock */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Entrées et Sorties de Stock</CardTitle>
              <CardDescription>Suivi des mouvements par date et fournisseur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Opérateur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{movement.date}</TableCell>
                        <TableCell className="font-medium">{movement.product}</TableCell>
                        <TableCell className="font-mono text-sm">{movement.sku}</TableCell>
                        <TableCell>
                          <Badge className={movement.type === "entrée" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                            {movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{movement.quantity}</TableCell>
                        <TableCell>{movement.supplier}</TableCell>
                        <TableCell>{movement.user}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== 3. RAPPORTS CLIENTS ==================== */}

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Rapport Clients et Fidélisation</CardTitle>
              <CardDescription>Analyse de la clientèle et des comportements d'achat</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Clients" value={customerData.length} icon={Users} color="bg-blue-500" />
                <StatCard title="Clients Fidèles" value={loyalCustomers.length} icon={UserCheck} color="bg-emerald-500" />
                <StatCard title="Nouveaux (30j)" value={newCustomers.length} icon={UserPlus} color="bg-purple-500" />
                <StatCard title="Panier Moyen" value={`$${(customerData.reduce((s, c) => s + c.averageBasket, 0) / customerData.length).toFixed(0)}`} icon={ShoppingCart} color="bg-amber-500" />
              </div>

              <h3 className="font-semibold mb-3">Top 10 Clients Fidèles</h3>
              <div className="overflow-x-auto mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Inscription</TableHead>
                      <TableHead className="text-right">Total Dépensé</TableHead>
                      <TableHead className="text-right">Nb Achats</TableHead>
                      <TableHead className="text-right">Panier Moyen</TableHead>
                      <TableHead>Dernier Achat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loyalCustomers.slice(0, 10).map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.registrationDate}</TableCell>
                        <TableCell className="text-right">${customer.totalSpent.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{customer.purchaseCount}</TableCell>
                        <TableCell className="text-right">${customer.averageBasket}</TableCell>
                        <TableCell>{customer.lastPurchase}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nouveaux vs Réguliers vs Fidèles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Nouveaux (30j)</span>
                        <span className="font-bold">{newCustomers.length}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(newCustomers.length / customerData.length) * 100}%` }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Clients Réguliers</span>
                        <span className="font-bold">{regularCustomers.length}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(regularCustomers.length / customerData.length) * 100}%` }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Clients Fidèles</span>
                        <span className="font-bold">{loyalCustomers.length}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(loyalCustomers.length / customerData.length) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tickets Moyens par Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Client Fidèle</span>
                        <span className="font-bold">${(loyalCustomers.reduce((s, c) => s + c.averageBasket, 0) / loyalCustomers.length || 0).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Client Régulier</span>
                        <span className="font-bold">${(regularCustomers.reduce((s, c) => s + c.averageBasket, 0) / regularCustomers.length || 0).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nouveau Client</span>
                        <span className="font-bold">${(newCustomers.reduce((s, c) => s + c.averageBasket, 0) / newCustomers.length || 0).toFixed(0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== 4. RAPPORTS PERSONNEL ==================== */}

        <TabsContent value="personnel">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Personnel</CardTitle>
              <CardDescription>Performances, horaires et objectifs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4" /> Performances par Vendeur</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendeur</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead className="text-right">Ventes Période</TableHead>
                          <TableHead className="text-right">Transactions</TableHead>
                          <TableHead className="text-right">Panier Moyen</TableHead>
                          <TableHead className="text-center">Satisfaction</TableHead>
                          <TableHead className="text-center">Atteinte Obj.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesBySeller.map((seller) => (
                          <TableRow key={seller.id}>
                            <TableCell className="font-medium">{seller.name}</TableCell>
                            <TableCell>{seller.role}</TableCell>
                            <TableCell className="text-right">${seller.salesThisMonth.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{seller.transactionsCount}</TableCell>
                            <TableCell className="text-right">${seller.averageBasket}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                <span>{seller.satisfactionScore}/5</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={seller.salesThisMonth >= seller.monthlyObjective ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                                {Math.round((seller.salesThisMonth / seller.monthlyObjective) * 100)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Horaires / Heures Travaillées</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {salesBySeller.map((seller) => (
                      <Card key={seller.id}>
                        <CardContent className="p-3">
                          <p className="font-medium">{seller.name}</p>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Heures/jour:</span>
                              <span className="font-semibold">{seller.dailyHours}h</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Heures/semaine:</span>
                              <span className="font-semibold">{seller.dailyHours * 5}h</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Target className="h-4 w-4" /> Objectifs vs Réalisés (Collectif)</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Période</TableHead>
                          <TableHead className="text-right">Objectif</TableHead>
                          <TableHead className="text-right">Réalisé</TableHead>
                          <TableHead className="text-center">Taux</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {objectives.map((obj) => (
                          <TableRow key={obj.id}>
                            <TableCell>{obj.period}</TableCell>
                            <TableCell className="text-right">${obj.objective.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${obj.achieved.toLocaleString()}</TableCell>
                            <TableCell className="text-center font-bold">{obj.percentage}%</TableCell>
                            <TableCell>
                              <Badge className={obj.percentage >= 100 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                                {obj.percentage >= 100 ? "Objectif atteint" : "Objectif non atteint"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* En-tête d'impression */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold">Rapport de la Boutique</h1>
        <p className="text-sm">Période : {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}</p>
        <p className="text-sm">Généré : {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}