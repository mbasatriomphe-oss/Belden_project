"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { 
  Plus, Search, Filter, Edit, Trash2, Package, MoreHorizontal, Loader2, 
  Upload, X, Eye, ShoppingCart, TrendingUp, AlertTriangle 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { produitsService, type Produit } from "@/lib/api-services/produits"
import { categoriesService, type Categorie } from "@/lib/api-services/categories"
import { unitesService, type Unite } from "@/lib/api-services/unites"

interface ProductFormData {
  nom: string
  categorie_id: number
  unite_id: number
  description: string
}

export default function ProductsPage() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [unites, setUnites] = useState<Unite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showSupplyDialog, setShowSupplyDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null)
  const [editingProduct, setEditingProduct] = useState<Produit | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [supplyQuantity, setSupplyQuantity] = useState(1)
  const [supplyPrice, setSupplyPrice] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<ProductFormData>({
    nom: "",
    categorie_id: 0,
    unite_id: 0,
    description: "",
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadProduits()
  }, [searchQuery, selectedCategory])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const [cats, units] = await Promise.all([
        categoriesService.getAll(),
        unitesService.getAll()
      ])
      setCategories(cats || [])
      setUnites(units || [])
      await loadProduits()
    } catch (error) {
      console.error("Erreur chargement données:", error)
      toast.error("Erreur", {
        description: "Impossible de charger les données initiales",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadProduits = async () => {
    try {
      const params: { search?: string; categorie_id?: number; per_page: number } = {
        per_page: 100
      }
      
      if (searchQuery) params.search = searchQuery
      if (selectedCategory !== "all") params.categorie_id = parseInt(selectedCategory)
      
      const response = await produitsService.getAll(params)
      setProduits(response.data || [])
    } catch (error) {
      console.error("Erreur chargement produits:", error)
      toast.error("Erreur", { description: "Impossible de charger les produits" })
      setProduits([])
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nom.trim()) {
      toast.error("Erreur", { description: "Le nom du produit est requis" })
      return
    }
    
    if (formData.categorie_id === 0) {
      toast.error("Erreur", { description: "Veuillez sélectionner une catégorie" })
      return
    }
    
    if (formData.unite_id === 0) {
      toast.error("Erreur", { description: "Veuillez sélectionner une unité" })
      return
    }

    try {
      setIsSubmitting(true)
      const formDataToSend = new FormData()
      formDataToSend.append('nom', formData.nom)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('categorie_id', formData.categorie_id.toString())
      formDataToSend.append('unite_id', formData.unite_id.toString())
      
      if (selectedImage) {
        formDataToSend.append('photo', selectedImage)
      }

      let result: Produit | null = null

      if (editingProduct) {
        formDataToSend.append('_method', 'PUT')
        result = await produitsService.updateWithImage(editingProduct.id, formDataToSend)
        if (result) {
          toast.success("Succès", { description: "Produit modifié avec succès" })
        }
      } else {
        result = await produitsService.createWithImage(formDataToSend)
        if (result) {
          toast.success("Succès", { description: "Produit ajouté avec succès" })
        }
      }
      
      if (result) {
        loadProduits()
        resetForm()
        setShowAddDialog(false)
      } else {
        toast.error("Erreur", { description: "Impossible de sauvegarder le produit" })
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur", { description: "Une erreur est survenue" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleView = (product: Produit) => {
    setSelectedProduct(product)
    setShowViewDialog(true)
  }

  const handleSupply = (product: Produit) => {
    setSelectedProduct(product)
    setSupplyQuantity(1)
    setSupplyPrice(product.prix_achat_moyen || 0)
    setShowSupplyDialog(true)
  }

  const handleSupplySubmit = async () => {
    if (!selectedProduct) return
    
    toast.success("Approvisionnement", {
      description: `${supplyQuantity} ${selectedProduct.unite?.nom} ajoutés au stock`
    })
    setShowSupplyDialog(false)
    loadProduits()
  }

  const handleEdit = (product: Produit) => {
    setEditingProduct(product)
    setFormData({
      nom: product.nom,
      categorie_id: product.categorie_id,
      unite_id: product.unite_id,
      description: product.description || "",
    })
    if (product.photo) {
      setImagePreview(product.photo)
    }
    setShowAddDialog(true)
  }

  const handleDelete = async (productId: number, productName: string) => {
    if (confirm(`Supprimer le produit "${productName}" ?`)) {
      try {
        const success = await produitsService.delete(productId)
        if (success) {
          toast.success("Succès", { description: "Produit supprimé avec succès" })
          loadProduits()
        }
      } catch (error) {
        console.error("Erreur suppression:", error)
        toast.error("Erreur", { description: "Impossible de supprimer le produit" })
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      categorie_id: 0,
      unite_id: 0,
      description: "",
    })
    setSelectedImage(null)
    setImagePreview(null)
    setEditingProduct(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStockStatus = (stock: number | undefined) => {
    const currentStock = stock || 0
    if (currentStock <= 0) return { label: "Rupture", variant: "destructive", icon: AlertTriangle }
    if (currentStock <= 10) return { label: "Stock faible", variant: "warning", icon: AlertTriangle }
    return { label: "En stock", variant: "success", icon: Package }
  }

  if (isLoading && produits.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Produits</h1>
          <p className="text-muted-foreground">Gérez votre catalogue de produits</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Modifier le produit" : "Ajouter un nouveau produit"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="nom">Nom du produit *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categorie_id">Catégorie *</Label>
                  <Select
                    value={formData.categorie_id.toString()}
                    onValueChange={(value) => setFormData({ ...formData, categorie_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="unite_id">Unité *</Label>
                  <Select
                    value={formData.unite_id.toString()}
                    onValueChange={(value) => setFormData({ ...formData, unite_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une unité" />
                    </SelectTrigger>
                    <SelectContent>
                      {unites.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.nom} ({unit.abreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Image du produit</Label>
                  <div className="mt-2">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Aperçu"
                          className="w-32 h-32 rounded-lg object-cover border"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                      >
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Cliquez pour sélectionner une image
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, JPEG, GIF, WEBP (max 2MB)
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingProduct ? "Modification..." : "Ajout..."}
                    </>
                  ) : (
                    editingProduct ? "Modifier" : "Ajouter"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des produits..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Prix vente</TableHead>
                <TableHead className="text-right">Marge</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produits.length > 0 ? (
                produits.map((product) => {
                  const currentStock = product.stock_actuel ?? 0
                  const stockStatus = getStockStatus(currentStock)
                  const marge = product.marge_brute ?? 0
                  const prixVente = product.prix_vente_actuel ?? 0
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.photo ? (
                          <img
                            src={product.photo}
                            alt={product.nom}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.nom}</TableCell>
                      <TableCell>{product.categorie?.nom || "-"}</TableCell>
                      <TableCell>{product.unite?.nom || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`font-medium ${
                            currentStock <= 10 ? "text-red-600" : "text-green-600"
                          }`}>
                            {currentStock}
                          </span>
                          {currentStock <= 10 && currentStock > 0 && (
                            <Progress value={(currentStock / 20) * 100} className="w-16 h-2" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {prixVente.toFixed(2)} $
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={marge > 30 ? "default" : "secondary"}>
                          {marge.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSupply(product)}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleDelete(product.id, product.nom)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aucun produit trouvé</p>
                      <Button variant="link" onClick={() => setShowAddDialog(true)}>
                        Ajouter votre premier produit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Product Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du produit</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {selectedProduct.photo ? (
                  <img
                    src={selectedProduct.photo}
                    alt={selectedProduct.nom}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedProduct.nom}</h3>
                  <p className="text-muted-foreground">SKU: {selectedProduct.sku || "Généré automatiquement"}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge>{selectedProduct.categorie?.nom}</Badge>
                    <Badge variant="outline">{selectedProduct.unite?.nom}</Badge>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Détails</TabsTrigger>
                  <TabsTrigger value="stock">Stock</TabsTrigger>
                  <TabsTrigger value="financial">Financier</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-2">
                  <p className="text-sm">{selectedProduct.description || "Aucune description"}</p>
                </TabsContent>
                <TabsContent value="stock" className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Stock actuel</p>
                      <p className="text-2xl font-bold">{selectedProduct.stock_actuel ?? 0}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <Badge variant={(selectedProduct.stock_actuel ?? 0) > 0 ? "default" : "destructive"}>
                        {(selectedProduct.stock_actuel ?? 0) > 0 ? "En stock" : "Rupture"}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="financial" className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Prix d'achat moyen</p>
                      <p className="text-2xl font-bold">{selectedProduct.prix_achat_moyen?.toFixed(2) ?? 0} $</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Prix de vente</p>
                      <p className="text-2xl font-bold text-green-600">{selectedProduct.prix_vente_actuel?.toFixed(2) ?? 0} $</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Marge brute</p>
                      <p className="text-xl font-bold">{selectedProduct.marge_brute?.toFixed(0) ?? 0}%</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Bénéfice unitaire</p>
                      <p className="text-xl font-bold">
                        {((selectedProduct.prix_vente_actuel ?? 0) - (selectedProduct.prix_achat_moyen ?? 0)).toFixed(2)} $
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Supply Dialog */}
      <Dialog open={showSupplyDialog} onOpenChange={setShowSupplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approvisionnement</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedProduct.photo ? (
                  <img
                    src={selectedProduct.photo}
                    alt={selectedProduct.nom}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{selectedProduct.nom}</h3>
                  <p className="text-sm text-muted-foreground">
                    Stock actuel: {selectedProduct.stock_actuel ?? 0} {selectedProduct.unite?.nom}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="quantity">Quantité à ajouter</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setSupplyQuantity(Math.max(1, supplyQuantity - 1))}
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      value={supplyQuantity}
                      onChange={(e) => setSupplyQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setSupplyQuantity(supplyQuantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="price">Prix d'achat unitaire ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={supplyPrice}
                    onChange={(e) => setSupplyPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-bold">{(supplyQuantity * supplyPrice).toFixed(2)} $</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSupplySubmit} className="flex-1">
                  Confirmer l'approvisionnement
                </Button>
                <Button variant="outline" onClick={() => setShowSupplyDialog(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}