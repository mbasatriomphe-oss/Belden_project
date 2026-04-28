"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
  TableFooter,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  Search,
  PackagePlus,
  Package,
  AlertTriangle,
  CheckCircle2,
  History,
  ArrowUpDown,
  Plus,
  Minus,
  Truck,
  Loader2,
  X,
  ShoppingCart,
  DollarSign,
  Eye,
  Filter,
  Calendar,
  Building2,
  FileText,
  Printer,
  Layers,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import { restockingService } from "@/lib/api-services/restocking"
import { useAuth } from "../../context/auth-context"
import { pdfService } from "@/lib/pdf-service"

export default function RestockingPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [restockHistory, setRestockHistory] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])
  const [fournisseurs, setFournisseurs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [stockFilter, setStockFilter] = useState("all")
  const [sortBy, setSortBy] = useState("nom")
  const [sortOrder, setSortOrder] = useState("asc")
  
  // Single product restock
  const [singleRestockModal, setSingleRestockModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [restockQuantity, setRestockQuantity] = useState("")
  const [restockPrice, setRestockPrice] = useState("")
  const [selectedFournisseur, setSelectedFournisseur] = useState("")
  
  // Product details modal (pour voir les lots FIFO)
  const [productDetailsModal, setProductDetailsModal] = useState(false)
  const [selectedProductDetails, setSelectedProductDetails] = useState(null)
  
  // Bulk restock
  const [bulkRestockModal, setBulkRestockModal] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [bulkQuantities, setBulkQuantities] = useState({})
  const [bulkPrices, setBulkPrices] = useState({})
  const [bulkFournisseur, setBulkFournisseur] = useState("")
  
  // History filters
  const [filters, setFilters] = useState({
    dateDebut: "",
    dateFin: "",
    fournisseurId: "all",
    mois: "all",
    annee: "",
    search: "",
    minMontant: "",
    maxMontant: "",
  })
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedApprovisionnement, setSelectedApprovisionnement] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [productsData, historyData, fournisseursData] = await Promise.all([
        restockingService.getProducts(),
        restockingService.getApprovisionnements(),
        restockingService.getFournisseurs(),
      ])
      setProducts(productsData || [])
      setRestockHistory(historyData || [])
      setFilteredHistory(historyData || [])
      setFournisseurs(fournisseursData || [])
    } catch (error) {
      console.error("Erreur chargement:", error)
      toast.error("Erreur", { description: "Impossible de charger les données" })
    } finally {
      setIsLoading(false)
    }
  }

  // Voir les détails d'un produit (lots FIFO)
  const viewProductDetails = (product) => {
    // Récupérer tous les lots d'approvisionnement pour ce produit
    const lots = restockHistory
      .flatMap(approv => 
        (approv.detailapprovisionnements || [])
          .filter(detail => detail.produit_id === product.id)
          .map(detail => ({
            id: detail.id,
            date: approv.date_approv,
            quantite: detail.quantite,
            prix_achat: detail.prix_achat,
            fournisseur: approv.fournisseur?.nom,
            restant: detail.quantite // En FIFO, on suivra la quantité restante
          }))
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    
    setSelectedProductDetails({
      ...product,
      lots
    })
    setProductDetailsModal(true)
  }

  const applyFilters = useCallback(() => {
    let result = [...restockHistory]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(item => 
        item.id.toString().includes(searchLower) ||
        item.fournisseur?.nom?.toLowerCase().includes(searchLower) ||
        item.admin?.nom?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.dateDebut) {
      result = result.filter(item => 
        new Date(item.date_approv) >= new Date(filters.dateDebut)
      )
    }

    if (filters.dateFin) {
      result = result.filter(item => 
        new Date(item.date_approv) <= new Date(filters.dateFin)
      )
    }

    if (filters.fournisseurId !== "all") {
      result = result.filter(item => 
        item.fournisseur_id === parseInt(filters.fournisseurId)
      )
    }

    if (filters.mois !== "all") {
      result = result.filter(item => 
        new Date(item.date_approv).getMonth() + 1 === parseInt(filters.mois)
      )
    }

    if (filters.annee) {
      result = result.filter(item => 
        new Date(item.date_approv).getFullYear() === parseInt(filters.annee)
      )
    }

    if (filters.minMontant) {
      result = result.filter(item => 
        (item.montant_total || 0) >= parseFloat(filters.minMontant)
      )
    }

    if (filters.maxMontant) {
      result = result.filter(item => 
        (item.montant_total || 0) <= parseFloat(filters.maxMontant)
      )
    }

    setFilteredHistory(result)
  }, [restockHistory, filters])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const resetFilters = () => {
    setFilters({
      dateDebut: "",
      dateFin: "",
      fournisseurId: "all",
      mois: "all",
      annee: "",
      search: "",
      minMontant: "",
      maxMontant: "",
    })
    toast.info("Filtres réinitialisés")
  }

  const viewApprovisionnementDetails = async (id) => {
    try {
      const data = await restockingService.getApprovisionnementDetails(id)
      setSelectedApprovisionnement(data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error("Erreur chargement détails:", error)
      toast.error("Erreur", { description: "Impossible de charger les détails" })
    }
  }

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((p) => p.nom?.toLowerCase().includes(query))
    }

    if (stockFilter === "low") {
      result = result.filter((p) => (p.stock_actuel || 0) <= 10)
    } else if (stockFilter === "out") {
      result = result.filter((p) => (p.stock_actuel || 0) === 0)
    } else if (stockFilter === "ok") {
      result = result.filter((p) => (p.stock_actuel || 0) > 10)
    }

    result.sort((a, b) => {
      let aVal, bVal
      if (sortBy === "nom") {
        aVal = a.nom || ""
        bVal = b.nom || ""
      } else if (sortBy === "prix_vente_actuel") {
        aVal = a.prix_vente_actuel || 0
        bVal = b.prix_vente_actuel || 0
      } else {
        aVal = a.stock_actuel || 0
        bVal = b.stock_actuel || 0
      }
      
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
  }, [products, searchQuery, stockFilter, sortBy, sortOrder])

  const lowStockCount = products.filter((p) => (p.stock_actuel || 0) <= 10).length

  const historyStats = useMemo(() => {
    const totalApprovisionnements = filteredHistory.length
    const totalFournisseurs = new Set(filteredHistory.map(h => h.fournisseur_id)).size
    const totalUnites = filteredHistory.reduce((sum, h) => 
      sum + (h.detailapprovisionnements?.reduce((s, d) => s + d.quantite, 0) || 0), 0)
    const totalMontant = filteredHistory.reduce((sum, h) => 
      sum + (h.montant_total || 0), 0)
    
    return { totalApprovisionnements, totalFournisseurs, totalUnites, totalMontant }
  }, [filteredHistory])

  const handleSingleRestock = (product) => {
    setSelectedProduct(product)
    setRestockQuantity("")
    setRestockPrice((product.prix_achat_moyen || 0).toString())
    setSelectedFournisseur("")
    setSingleRestockModal(true)
  }

  const confirmSingleRestock = async () => {
    const qty = parseInt(restockQuantity, 10)
    if (!qty || qty <= 0) {
      toast.error("Erreur", { description: "Quantité invalide" })
      return
    }
    
    if (!selectedFournisseur) {
      toast.error("Erreur", { description: "Veuillez sélectionner un fournisseur" })
      return
    }

    try {
      setIsSubmitting(true)
      
      const approv = await restockingService.createApprovisionnement({
        date_approv: new Date().toISOString(),
        fournisseur_id: parseInt(selectedFournisseur),
        admin_id: user?.id || 1,
      })
      
      if (approv) {
        await restockingService.addDetailApprovisionnement({
          approv_id: approv.id,
          produit_id: selectedProduct.id,
          quantite: qty,
          prix_achat: parseFloat(restockPrice) || 0,
        })
        
        toast.success("Succès", { description: `${qty} ${selectedProduct.unite?.nom || "unités"} ajoutés au stock` })
        loadData()
        setSingleRestockModal(false)
        setSuccessMessage(`${qty} unités de ${selectedProduct.nom} réapprovisionnées`)
        setTimeout(() => setSuccessMessage(""), 3000)
      }
    } catch (error) {
      console.error("Erreur restock:", error)
      toast.error("Erreur", { description: "Impossible d'effectuer le réapprovisionnement" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const selectAllLowStock = () => {
    const lowStockIds = products
      .filter((p) => (p.stock_actuel || 0) <= 10)
      .map((p) => p.id)
    setSelectedProducts(lowStockIds)
    toast.info(`${lowStockIds.length} produit(s) sélectionné(s)`)
  }

  const selectAllFiltered = () => {
    const allIds = filteredProducts.map((p) => p.id)
    setSelectedProducts(allIds)
    toast.info(`${allIds.length} produit(s) sélectionné(s)`)
  }

  const clearSelection = () => {
    setSelectedProducts([])
    toast.info("Sélection effacée")
  }

  const openBulkRestock = () => {
    if (selectedProducts.length === 0) {
      toast.error("Erreur", { description: "Veuillez sélectionner au moins un produit" })
      return
    }
    const quantities = {}
    const prices = {}
    selectedProducts.forEach((id) => {
      const product = products.find((p) => p.id === id)
      if (product) {
        quantities[id] = 10
        prices[id] = product.prix_achat_moyen || 0
      }
    })
    setBulkQuantities(quantities)
    setBulkPrices(prices)
    setBulkFournisseur("")
    setBulkRestockModal(true)
  }

  const updateBulkQuantity = (productId, value) => {
    const qty = parseInt(value, 10) || 0
    setBulkQuantities((prev) => ({ ...prev, [productId]: qty }))
  }

  const updateBulkPrice = (productId, value) => {
    const price = parseFloat(value) || 0
    setBulkPrices((prev) => ({ ...prev, [productId]: price }))
  }

  const confirmBulkRestock = async () => {
    if (!bulkFournisseur) {
      toast.error("Erreur", { description: "Veuillez sélectionner un fournisseur" })
      return
    }

    const productsToRestock = selectedProducts.filter((id) => (bulkQuantities[id] || 0) > 0)
    
    if (productsToRestock.length === 0) {
      toast.error("Erreur", { description: "Veuillez spécifier au moins une quantité valide" })
      return
    }

    try {
      setIsSubmitting(true)
      
      const approv = await restockingService.createApprovisionnement({
        date_approv: new Date().toISOString(),
        fournisseur_id: parseInt(bulkFournisseur),
        admin_id: user?.id || 1,
      })
      
      if (approv) {
        let totalItems = 0
        for (const productId of productsToRestock) {
          const qty = bulkQuantities[productId]
          const price = bulkPrices[productId] || 0
          if (qty > 0) {
            await restockingService.addDetailApprovisionnement({
              approv_id: approv.id,
              produit_id: productId,
              quantite: qty,
              prix_achat: price,
            })
            totalItems += qty
          }
        }
        
        toast.success("Succès", { description: `${productsToRestock.length} produits réapprovisionnés (${totalItems} unités)` })
        loadData()
        setBulkRestockModal(false)
        setSelectedProducts([])
        setSuccessMessage(`${productsToRestock.length} produits réapprovisionnés avec succès`)
        setTimeout(() => setSuccessMessage(""), 3000)
      }
    } catch (error) {
      console.error("Erreur bulk restock:", error)
      toast.error("Erreur", { description: "Impossible d'effectuer le réapprovisionnement multiple" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStockBadge = (product) => {
    const stock = product.stock_actuel || 0
    if (stock === 0) {
      return <Badge variant="destructive">Rupture</Badge>
    }
    if (stock <= 10) {
      return <Badge className="bg-amber-100 text-amber-700">Stock faible</Badge>
    }
    return <Badge className="bg-emerald-100 text-emerald-700">En stock</Badge>
  }

  // Générer le rapport PDF des approvisionnements
const genererRapportPDF = async () => {
  if (pdfLoading) return
  
  setPdfLoading(true)
  
  const generatePromise = pdfService.genererRapportApprovisionnements({
    titre: "Rapport d'Approvisionnement",
    sousTitre: "Gestion des réapprovisionnements",
    dateGeneration: new Date().toLocaleString('fr-FR'),
    periode: "Toute la période",
    statistiques: {
      totalApprovisionnements: historyStats.totalApprovisionnements,
      totalFournisseurs: historyStats.totalFournisseurs,
      totalUnites: historyStats.totalUnites,
      totalMontant: historyStats.totalMontant
    },
    approvisionnements: filteredHistory
  })
  
  toast.promise(generatePromise, {
    loading: "Génération du rapport PDF...",
    success: "PDF généré avec succès",
    error: (err) => `Erreur: ${err.message || "Impossible de générer le PDF"}`
  })
  
  try {
    await generatePromise
  } finally {
    setPdfLoading(false)
  }
}

  // Générer le rapport complet des stocks
  const genererRapportComplet = async () => {
    if (pdfLoading) return
    try {
      setPdfLoading(true)
      toast.loading("Génération du rapport complet...")
      
      const allProducts = await restockingService.getProducts()
      const statsProduits = {
        totalProduits: allProducts.length,
        stockFaible: allProducts.filter(p => (p.stock_actuel || 0) <= 10).length,
        rupture: allProducts.filter(p => (p.stock_actuel || 0) === 0).length,
        valeurTotale: allProducts.reduce((sum, p) => sum + ((p.stock_actuel || 0) * (p.prix_vente_actuel || 0)), 0)
      }
      
      await pdfService.genererRapportProduits(allProducts, statsProduits)
      
      toast.dismiss()
      toast.success("Rapport complet généré")
    } catch (error) {
      toast.dismiss()
      console.error("Erreur:", error)
      toast.error("Erreur", { description: error.message || "Impossible de générer le rapport" })
    } finally {
      setPdfLoading(false)
    }
  }

  // Générer le rapport PDF pour un seul approvisionnement
  const genererRapportApprovisionnementUnique = async (approvisionnement) => {
    if (pdfLoading) return
    try {
      setPdfLoading(true)
      toast.loading("Génération du PDF...")
      
      const totalUnites = approvisionnement.detailapprovisionnements?.reduce((sum, d) => sum + (Number(d.quantite) || 0), 0) || 0
      
      await pdfService.genererRapportApprovisionnementUnique({
        approvisionnement: approvisionnement,
        titre: "Bon d'Approvisionnement",
        sousTitre: "Détail de l'approvisionnement",
        dateGeneration: new Date().toLocaleString('fr-FR'),
        statistiques: {
          totalProduits: approvisionnement.detailapprovisionnements?.length || 0,
          totalUnites: totalUnites,
          montantTotal: approvisionnement.montant_total || 0
        }
      })
      
      toast.dismiss()
      toast.success("PDF généré")
    } catch (error) {
      toast.dismiss()
      console.error("Erreur:", error)
      toast.error("Erreur", { description: error.message || "Impossible de générer le PDF" })
    } finally {
      setPdfLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Réapprovisionnement</h1>
          <p className="text-muted-foreground">Gérez votre stock et réapprovisionnez les produits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={selectAllLowStock}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Stock faible ({lowStockCount})
          </Button>
          <Button variant="outline" onClick={selectAllFiltered}>
            <PackagePlus className="h-4 w-4 mr-2" />
            Tout sélectionner
          </Button>
          <Button variant="outline" onClick={genererRapportPDF} disabled={pdfLoading}>
            <FileText className="h-4 w-4 mr-2" />
            Rapport PDF
          </Button>
          <Button variant="outline" onClick={genererRapportComplet} disabled={pdfLoading}>
            <Printer className="h-4 w-4 mr-2" />
            Rapport complet
          </Button>
          {selectedProducts.length > 0 && (
            <Button variant="ghost" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {successMessage && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cartes statistiques existantes... */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Produits</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock faible</p>
                <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rupture</p>
                <p className="text-2xl font-bold text-red-600">
                  {products.filter((p) => (p.stock_actuel || 0) === 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Truck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approvisionnements</p>
                <p className="text-2xl font-bold">{restockHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="low">Stock faible</SelectItem>
                    <SelectItem value="out">Rupture</SelectItem>
                    <SelectItem value="ok">En stock</SelectItem>
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

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProducts(filteredProducts.map((p) => p.id))
                            } else {
                              setSelectedProducts([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Prix vente</TableHead>
                      <TableHead className="text-center">Prix achat moyen</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.photo ? (
                              <img
                                src={product.photo}
                                alt={product.nom}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                            <p className="font-medium">{product.nom}</p>
                          </div>
                        </TableCell>
                        <TableCell>{product.categorie?.nom || "-"}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${(product.stock_actuel || 0) <= 10 ? "text-amber-600" : ""}`}>
                            {product.stock_actuel || 0}
                          </span>
                        </TableCell>
                        <TableCell>{getStockBadge(product)}</TableCell>
                        <TableCell>{(product.prix_vente_actuel || 0).toFixed(2)} $</TableCell>
                        <TableCell className="text-center">
                          <span className="text-blue-600 font-medium">
                            {(product.prix_achat_moyen || 0).toFixed(2)} $
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => viewProductDetails(product)}
                              title="Voir les lots d'approvisionnement"
                            >
                              <Layers className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={() => handleSingleRestock(product)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Réapprovisionner
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Contenu de l'historique existant... */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Filtres de recherche</CardTitle>
                  <CardDescription>
                    {filteredHistory.length} approvisionnement(s) trouvé(s) sur {restockHistory.length}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={genererRapportPDF}
                    disabled={pdfLoading}
                    className="border-blue-500 text-blue-600"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exporter PDF
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {showAdvancedFilters ? "Filtres simples" : "Filtres avancés"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtres existants... */}
              <div className="grid gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par ID, fournisseur..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                {/* ... reste des filtres ... */}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Cartes statistiques existantes... */}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des approvisionnements</CardTitle>
              <CardDescription>Cliquez sur un approvisionnement pour voir les détails</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 border rounded-lg hover:shadow-md hover:bg-muted/30 cursor-pointer transition-all duration-200"
                    onClick={() => viewApprovisionnementDetails(entry.id)}
                  >
                    {/* Contenu de la carte existant... */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-lg">#{entry.id}</p>
                          <Badge className="bg-emerald-100 text-emerald-700">Complété</Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(entry.date_approv).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {entry.fournisseur?.nom || "N/A"}
                          </span>
                          <span className="text-muted-foreground">
                            Par: {entry.admin?.nom || "Admin"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-600">
                          {(entry.montant_total || 0).toLocaleString()} $
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.detailapprovisionnements?.length || 0} produit(s)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedProducts.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <Button
            onClick={openBulkRestock}
            size="lg"
            className="shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-3 px-6 py-6 rounded-full"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">
              Réapprovisionner {selectedProducts.length} produit{selectedProducts.length > 1 ? "s" : ""}
            </span>
            <Badge className="bg-white/20 text-white hover:bg-white/30 ml-2">
              {selectedProducts.length}
            </Badge>
          </Button>
        </div>
      )}

      {/* Modal Détails Approvisionnement */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Détails de l'approvisionnement</DialogTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => genererRapportApprovisionnementUnique(selectedApprovisionnement)}
                disabled={pdfLoading}
                className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Printer className="h-4 w-4" />
                {pdfLoading ? "Génération..." : "Imprimer / PDF"}
              </Button>
            </div>
          </DialogHeader>
          {selectedApprovisionnement && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">N° Approvisionnement</p>
                  <p className="font-semibold text-lg">#{selectedApprovisionnement.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">
                    {new Date(selectedApprovisionnement.date_approv).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fournisseur</p>
                  <p className="font-semibold">{selectedApprovisionnement.fournisseur?.nom || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Traité par</p>
                  <p className="font-semibold">{selectedApprovisionnement.admin?.nom || "Admin"}</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Montant total</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {(selectedApprovisionnement.montant_total || 0).toLocaleString()} $
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Produits réapprovisionnés</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="text-right">Prix unitaire</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedApprovisionnement.detailapprovisionnements?.map((detail) => {
                        // Conversion sécurisée des valeurs
                        const quantite = Number(detail.quantite) || 0;
                        const prixAchat = typeof detail.prix_achat === 'string' ? parseFloat(detail.prix_achat) : (Number(detail.prix_achat) || 0);
                        const total = quantite * prixAchat;
                        
                        return (
                          <TableRow key={detail.id}>
                            <TableCell className="font-medium">{detail.produit?.nom || "Produit"}</TableCell>
                            <TableCell className="text-right">{quantite}</TableCell>
                            <TableCell className="text-right">{prixAchat.toFixed(2)} $</TableCell>
                            <TableCell className="text-right text-emerald-600 font-semibold">
                              {total.toLocaleString()} $
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">Total général :</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {(selectedApprovisionnement.montant_total || 0).toLocaleString()} $
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Détails Produit avec Lots FIFO */}
      {/* Modal Détails Produit avec Lots FIFO - Version corrigée */}
      <Dialog open={productDetailsModal} onOpenChange={setProductDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du produit - Gestion FIFO</DialogTitle>
          </DialogHeader>
          {selectedProductDetails && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                {selectedProductDetails.photo ? (
                  <img
                    src={selectedProductDetails.photo}
                    alt={selectedProductDetails.nom}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selectedProductDetails.nom}</h3>
                  <p className="text-muted-foreground">{selectedProductDetails.categorie?.nom}</p>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Stock actuel:</span>
                      <span className="ml-2 font-semibold">{selectedProductDetails.stock_actuel || 0}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Prix achat moyen:</span>
                      <span className="ml-2 font-semibold text-blue-600">
                        {(() => {
                          const prix = selectedProductDetails.prix_achat_moyen || 0;
                          const prixNum = typeof prix === 'string' ? parseFloat(prix) : prix;
                          return prixNum.toFixed(2);
                        })()} $
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Prix vente:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        {(() => {
                          const prix = selectedProductDetails.prix_vente_actuel || 0;
                          const prixNum = typeof prix === 'string' ? parseFloat(prix) : prix;
                          return prixNum.toFixed(2);
                        })()} $
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Lots d'approvisionnement (FIFO)
                </h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead className="text-right">Quantité reçue</TableHead>
                        <TableHead className="text-right">Prix unitaire</TableHead>
                        <TableHead className="text-right">Valeur du lot</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProductDetails.lots && selectedProductDetails.lots.length > 0 ? (
                        selectedProductDetails.lots.map((lot, index) => {
                          // Conversion sécurisée des valeurs
                          const quantite = Number(lot.quantite) || 0;
                          const prixAchat = typeof lot.prix_achat === 'string' ? parseFloat(lot.prix_achat) : (Number(lot.prix_achat) || 0);
                          const valeurLot = quantite * prixAchat;
                          
                          return (
                            <TableRow key={lot.id || index}>
                              <TableCell>{lot.date ? new Date(lot.date).toLocaleDateString('fr-FR') : '-'}</TableCell>
                              <TableCell>{lot.fournisseur || "-"}</TableCell>
                              <TableCell className="text-right">{quantite}</TableCell>
                              <TableCell className="text-right">{prixAchat.toFixed(2)} $</TableCell>
                              <TableCell className="text-right text-emerald-600">
                                {valeurLot.toLocaleString()} $
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Aucun lot d'approvisionnement trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="font-bold">Total lots</TableCell>
                        <TableCell className="text-right font-bold">
                          {selectedProductDetails.lots?.reduce((sum, l) => sum + (Number(l.quantite) || 0), 0) || 0}
                        </TableCell>
                        <TableCell colSpan={2} className="text-right font-bold text-emerald-600">
                          Valeur totale: {selectedProductDetails.lots?.reduce((sum, l) => {
                            const quantite = Number(l.quantite) || 0;
                            const prix = typeof l.prix_achat === 'string' ? parseFloat(l.prix_achat) : (Number(l.prix_achat) || 0);
                            return sum + (quantite * prix);
                          }, 0).toLocaleString()} $
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Information FIFO
                </h4>
                <p className="text-sm text-muted-foreground">
                    La gestion FIFO (First In, First Out) signifie que les premiers produits entrés en stock 
                    sont les premiers à être vendus. Le prix d'achat moyen est calculé comme la moyenne 
                    pondérée de tous les lots d'approvisionnement.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDetailsModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Restock Modal - existant */}
      <Dialog open={singleRestockModal} onOpenChange={setSingleRestockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réapprovisionnement unique</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                {selectedProduct.photo ? (
                  <img
                    src={selectedProduct.photo}
                    alt={selectedProduct.nom}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{selectedProduct.nom}</p>
                  <p className="text-sm text-muted-foreground">
                    Stock actuel: {selectedProduct.stock_actuel || 0} {selectedProduct.unite?.nom}
                  </p>
                </div>
              </div>

              <div>
                <Label>Fournisseur</Label>
                <Select value={selectedFournisseur} onValueChange={setSelectedFournisseur}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {fournisseurs.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantité</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button variant="outline" size="icon" onClick={() => setRestockQuantity((prev) => Math.max(0, (parseInt(prev) || 0) - 10).toString())}>
                    <Minus />
                  </Button>
                  <Input
                    type="number"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    className="text-center"
                    placeholder="Quantité"
                  />
                  <Button variant="outline" size="icon" onClick={() => setRestockQuantity((prev) => ((parseInt(prev) || 0) + 10).toString())}>
                    <Plus />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Prix d'achat unitaire ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={restockPrice}
                  onChange={(e) => setRestockPrice(e.target.value)}
                  placeholder="Prix d'achat"
                />
              </div>

              {restockQuantity && parseInt(restockQuantity) > 0 && (
                <Alert>
                  <AlertDescription>
                    Total: {(parseInt(restockQuantity) * parseFloat(restockPrice)).toLocaleString()} $
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleRestockModal(false)}>Annuler</Button>
            <Button onClick={confirmSingleRestock} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Restock Modal - existant */}
      <Dialog open={bulkRestockModal} onOpenChange={setBulkRestockModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Réapprovisionnement multiple</DialogTitle>
            <CardDescription>
              Vous allez réapprovisionner {selectedProducts.length} produit(s)
            </CardDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <Label>Fournisseur (commun à tous les produits)</Label>
              <Select value={bulkFournisseur} onValueChange={setBulkFournisseur}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {fournisseurs.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Produits sélectionnés</h4>
              {selectedProducts.map((productId) => {
                const product = products.find((p) => p.id === productId)
                if (!product) return null
                return (
                  <div key={productId} className="flex items-center gap-4 p-3 border rounded-lg">
                    {product.photo ? (
                      <img src={product.photo} alt={product.nom} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{product.nom}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.stock_actuel || 0} {product.unite?.nom}
                      </p>
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        value={bulkQuantities[productId] || ""}
                        onChange={(e) => updateBulkQuantity(productId, e.target.value)}
                        placeholder="Qté"
                        className="text-center"
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        step="0.01"
                        value={bulkPrices[productId] || ""}
                        onChange={(e) => updateBulkPrice(productId, e.target.value)}
                        placeholder="Prix"
                        className="text-center"
                      />
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-sm font-semibold text-emerald-600">
                        {((bulkQuantities[productId] || 0) * (bulkPrices[productId] || 0)).toLocaleString()} $
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between">
                <span>Total produits:</span>
                <span className="font-semibold">{selectedProducts.filter(id => (bulkQuantities[id] || 0) > 0).length}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Total unités:</span>
                <span className="font-semibold">
                  {selectedProducts.reduce((sum, id) => sum + (bulkQuantities[id] || 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Montant total:</span>
                <span className="font-semibold text-emerald-600">
                  {selectedProducts.reduce((sum, id) => sum + ((bulkQuantities[id] || 0) * (bulkPrices[id] || 0)), 0).toLocaleString()} $
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRestockModal(false)}>Annuler</Button>
            <Button onClick={confirmBulkRestock} disabled={isSubmitting || !bulkFournisseur}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}