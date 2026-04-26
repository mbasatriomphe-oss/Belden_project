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
  Filter,
  ArrowUpDown,
  BarChart3,
  History,
  FileText,
} from "lucide-react"
import { products } from "../../data/products"

// Générer des données de stock complètes
const generateStockData = () => {
  return products.map((product, index) => {
    const currentStock = Math.floor(Math.random() * 150) + 5
    const minStock = 10
    const maxStock = 150
    const costPrice = product.price * 0.6
    const movements = []
    
    // Générer des mouvements aléatoires pour les 30 derniers jours
    for (let i = 0; i < 10; i++) {
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 30))
      const type = Math.random() > 0.3 ? "vente" : "réapprovisionnement"
      const quantity = type === "vente" 
        ? Math.floor(Math.random() * 10) + 1 
        : Math.floor(Math.random() * 50) + 10
      movements.push({
        date: date.toISOString().split("T")[0],
        type,
        quantity,
        balance: currentStock + (type === "vente" ? quantity : -quantity),
      })
    }
    
    return {
      ...product,
      sku: `SKU-${String(index + 1).padStart(4, "0")}`,
      currentStock,
      minStock,
      maxStock,
      costPrice,
      totalValue: currentStock * costPrice,
      retailValue: currentStock * product.price,
      supplier: ["Fournisseur A", "Fournisseur B", "Fournisseur C"][Math.floor(Math.random() * 3)],
      lastRestock: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      movements: movements.sort((a, b) => new Date(b.date) - new Date(a.date)),
      salesLast30Days: Math.floor(Math.random() * 100) + 10,
      restocksLast30Days: Math.floor(Math.random() * 3) + 1,
    }
  })
}

// Données d'historique de réapprovisionnement
const RESTOCK_HISTORY = [
  {
    id: "RS001",
    date: "2024-01-17",
    products: [
      { name: "Cheeseburger", sku: "SKU-0001", quantity: 50, cost: 5.39 },
      { name: "Frites", sku: "SKU-0005", quantity: 100, cost: 2.39 },
    ],
    totalCost: 509.00,
    supplier: "Fournisseur A",
    status: "terminé",
    processedBy: "Admin",
  },
  {
    id: "RS002",
    date: "2024-01-15",
    products: [
      { name: "Coca Cola", sku: "SKU-0006", quantity: 200, cost: 1.49 },
      { name: "Thé Glacé", sku: "SKU-0007", quantity: 150, cost: 1.79 },
    ],
    totalCost: 566.50,
    supplier: "Fournisseur B",
    status: "terminé",
    processedBy: "Admin",
  },
  {
    id: "RS003",
    date: "2024-01-12",
    products: [
      { name: "Gâteau au Chocolat", sku: "SKU-0011", quantity: 30, cost: 3.59 },
    ],
    totalCost: 107.70,
    supplier: "Fournisseur C",
    status: "terminé",
    processedBy: "Admin",
  },
]

export default function StockReportsPage() {
  const [stockData] = useState(() => generateStockData())
  const [selectedReport, setSelectedReport] = useState("sheet")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [dateRange, setDateRange] = useState("30")
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Calculer les totaux
  const totals = useMemo(() => {
    const filtered = stockData.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false
      if (stockFilter === "low" && p.currentStock > p.minStock) return false
      if (stockFilter === "out" && p.currentStock > 0) return false
      if (stockFilter === "ok" && p.currentStock <= p.minStock) return false
      return true
    })

    return {
      totalProducts: filtered.length,
      totalStock: filtered.reduce((sum, p) => sum + p.currentStock, 0),
      totalCostValue: filtered.reduce((sum, p) => sum + p.totalValue, 0),
      totalRetailValue: filtered.reduce((sum, p) => sum + p.retailValue, 0),
      lowStockItems: filtered.filter((p) => p.currentStock <= p.minStock).length,
      outOfStockItems: filtered.filter((p) => p.currentStock === 0).length,
    }
  }, [stockData, categoryFilter, stockFilter])

  // Filtrer et trier
  const filteredData = useMemo(() => {
    let result = [...stockData]

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter)
    }

    if (stockFilter === "low") {
      result = result.filter((p) => p.currentStock <= p.minStock && p.currentStock > 0)
    } else if (stockFilter === "out") {
      result = result.filter((p) => p.currentStock === 0)
    } else if (stockFilter === "ok") {
      result = result.filter((p) => p.currentStock > p.minStock)
    }

    result.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })

    return result
  }, [stockData, categoryFilter, stockFilter, sortBy, sortOrder])

  const getStockBadge = (product) => {
    if (product.currentStock === 0) {
      return <Badge variant="destructive">Rupture</Badge>
    }
    if (product.currentStock <= product.minStock) {
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Stock Faible</Badge>
    }
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">OK</Badge>
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    // Créer le contenu CSV
    let csvContent = "data:text/csv;charset=utf-8,"
    
    if (selectedReport === "sheet") {
      csvContent += "SKU,Produit,Catégorie,Stock Actuel,Stock Mini,Prix Revient,Valeur Totale,Statut\n"
      filteredData.forEach((p) => {
        csvContent += `${p.sku},${p.name},${p.category},${p.currentStock},${p.minStock},${p.costPrice.toFixed(2)},${p.totalValue.toFixed(2)},${p.currentStock <= p.minStock ? "Faible" : "OK"}\n`
      })
    } else if (selectedReport === "valuation") {
      csvContent += "SKU,Produit,Catégorie,Quantité,Prix Revient,Prix Vente,Valeur Revient,Valeur Vente\n"
      filteredData.forEach((p) => {
        csvContent += `${p.sku},${p.name},${p.category},${p.currentStock},${p.costPrice.toFixed(2)},${p.price.toFixed(2)},${p.totalValue.toFixed(2)},${p.retailValue.toFixed(2)}\n`
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `rapport_stock_${selectedReport}_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rapports de Stock</h1>
          <p className="text-muted-foreground">
            Fiches de stock complètes et rapports d'inventaire
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
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

      {/* Cartes de résumé */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Produits</p>
                <p className="text-xl font-bold text-foreground">{totals.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">Stock Total</p>
                <p className="text-xl font-bold text-foreground">{totals.totalStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs text-muted-foreground">Valeur Revient</p>
                <p className="text-xl font-bold text-foreground">${totals.totalCostValue.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <div>
                <p className="text-xs text-muted-foreground">Valeur Vente</p>
                <p className="text-xl font-bold text-foreground">${totals.totalRetailValue.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs text-muted-foreground">Stock Faible</p>
                <p className="text-xl font-bold text-foreground">{totals.lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-xs text-muted-foreground">Rupture</p>
                <p className="text-xl font-bold text-foreground">{totals.outOfStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets des rapports */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-4">
        <TabsList className="print:hidden">
          <TabsTrigger value="sheet">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Fiche de Stock
          </TabsTrigger>
          <TabsTrigger value="movements">
            <History className="h-4 w-4 mr-2" />
            Mouvements
          </TabsTrigger>
          <TabsTrigger value="lowstock">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alertes Stock Faible
          </TabsTrigger>
          <TabsTrigger value="valuation">
            <DollarSign className="h-4 w-4 mr-2" />
            Évaluation Stock
          </TabsTrigger>
          <TabsTrigger value="restock-history">
            <FileText className="h-4 w-4 mr-2" />
            Historique Réappro
          </TabsTrigger>
        </TabsList>

        {/* Filtres - partagés entre les onglets */}
        <Card className="print:hidden">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
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

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Niveau Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout Stock</SelectItem>
                  <SelectItem value="low">Stock Faible</SelectItem>
                  <SelectItem value="out">Rupture</SelectItem>
                  <SelectItem value="ok">En Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Derniers Jours</SelectItem>
                  <SelectItem value="30">30 Derniers Jours</SelectItem>
                  <SelectItem value="90">90 Derniers Jours</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rapport Fiche de Stock */}
        <TabsContent value="sheet">
          <Card>
            <CardHeader>
              <CardTitle>Fiche de Stock</CardTitle>
              <CardDescription>
                Liste complète des stocks avec niveaux actuels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-center">Stock Actuel</TableHead>
                      <TableHead className="text-center">Stock Mini</TableHead>
                      <TableHead className="text-center">Stock Maxi</TableHead>
                      <TableHead className="text-right">Prix Revient</TableHead>
                      <TableHead className="text-right">Valeur Totale</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Dernier Réappro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                        <TableCell className="capitalize">{product.category}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${
                            product.currentStock <= product.minStock
                              ? "text-amber-600"
                              : "text-foreground"
                          }`}>
                            {product.currentStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{product.minStock}</TableCell>
                        <TableCell className="text-center">{product.maxStock}</TableCell>
                        <TableCell className="text-right">${product.costPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${product.totalValue.toFixed(2)}</TableCell>
                        <TableCell>{getStockBadge(product)}</TableCell>
                        <TableCell>{product.lastRestock}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Ligne des totaux */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Totaux :</span>
                  <div className="flex gap-8">
                    <div>
                      <span className="text-muted-foreground">Total Articles : </span>
                      <span className="font-bold text-foreground">{totals.totalStock}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valeur Totale : </span>
                      <span className="font-bold text-foreground">${totals.totalCostValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rapport Mouvements de Stock */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Mouvements de Stock</CardTitle>
              <CardDescription>Suivi des entrées et sorties d'inventaire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setSelectedProduct(
                          selectedProduct === product.id ? null : product.id
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Derniers {dateRange} Jours</p>
                          <div className="flex gap-2">
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              -{product.salesLast30Days} ventes
                            </Badge>
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              +{product.restocksLast30Days} réappro
                            </Badge>
                          </div>
                        </div>
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {selectedProduct === product.id && (
                      <div className="mt-4 border-t pt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">Quantité</TableHead>
                              <TableHead className="text-right">Solde</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product.movements.slice(0, 5).map((movement, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{movement.date}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      movement.type === "vente"
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    }
                                  >
                                    {movement.type === "vente" ? "Vente" : "Réapprovisionnement"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {movement.type === "vente" ? "-" : "+"}
                                  {movement.quantity}
                                </TableCell>
                                <TableCell className="text-right">{movement.balance}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertes Stock Faible */}
        <TabsContent value="lowstock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alertes Stock Faible
              </CardTitle>
              <CardDescription>Produits nécessitant un réapprovisionnement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockData
                  .filter((p) => p.currentStock <= p.minStock)
                  .sort((a, b) => a.currentStock - b.currentStock)
                  .map((product) => (
                    <div
                      key={product.id}
                      className={`p-4 rounded-lg border-2 ${
                        product.currentStock === 0
                          ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
                          : "border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.sku} | {product.supplier}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            product.currentStock === 0 ? "text-red-600" : "text-amber-600"
                          }`}>
                            {product.currentStock}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            sur {product.minStock} min
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Commande Suggérée</p>
                          <p className="text-lg font-bold text-foreground">
                            {product.maxStock - product.currentStock}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                {stockData.filter((p) => p.currentStock <= p.minStock).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune alerte stock faible. Tous les produits sont bien approvisionnés.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rapport Évaluation des Stocks */}
        <TabsContent value="valuation">
          <Card>
            <CardHeader>
              <CardTitle>Évaluation des Stocks</CardTitle>
              <CardDescription>Valeur financière de l'inventaire actuel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-center">Quantité</TableHead>
                      <TableHead className="text-right">Prix Revient</TableHead>
                      <TableHead className="text-right">Prix Vente</TableHead>
                      <TableHead className="text-right">Valeur Revient</TableHead>
                      <TableHead className="text-right">Valeur Vente</TableHead>
                      <TableHead className="text-right">Marge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((product) => {
                      const margin = ((product.price - product.costPrice) / product.price) * 100
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                          <TableCell className="capitalize">{product.category}</TableCell>
                          <TableCell className="text-center">{product.currentStock}</TableCell>
                          <TableCell className="text-right">${product.costPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${product.totalValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${product.retailValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              {margin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Résumé de l'évaluation */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Valeur Totale Revient</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${totals.totalCostValue.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Valeur Totale Vente</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${totals.totalRetailValue.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Profit Potentiel</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${(totals.totalRetailValue - totals.totalCostValue).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique des Réapprovisionnements */}
        <TabsContent value="restock-history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Réapprovisionnements</CardTitle>
              <CardDescription>Enregistrement de toutes les activités de réapprovisionnement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RESTOCK_HISTORY.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">Commande #{entry.id}</p>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {entry.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {entry.date} | {entry.supplier} | Traité par : {entry.processedBy}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Coût Total</p>
                        <p className="text-xl font-bold text-foreground">${entry.totalCost.toFixed(2)}</p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-right">Quantité</TableHead>
                          <TableHead className="text-right">Prix Unitaire</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entry.products.map((product, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell className="text-right">{product.quantity}</TableCell>
                            <TableCell className="text-right">${product.cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">
                              ${(product.quantity * product.cost).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* En-tête d'impression - visible uniquement lors de l'impression */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold">Rapport de Stock</h1>
        <p className="text-sm">Généré : {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}