"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import { PlusCircle, Loader2, Search, Filter, X } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCart } from "../context/cart-context"
import { produitsService, type Produit } from "@/lib/api-services/produits"
import { categoriesService, type Categorie } from "@/lib/api-services/categories"
import { toast } from "sonner"

interface ProductGridProps {
  category?: string
  searchQuery?: string
  onProductSelect?: (product: Produit) => void
}

export default function ProductGrid({ 
  category: externalCategory, 
  searchQuery: externalSearchQuery,
  onProductSelect 
}: ProductGridProps) {
  const { addToCart } = useCart()
  const [products, setProducts] = useState<Produit[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // États pour la recherche et les filtres
  const [localSearchQuery, setLocalSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 })
  const [showFilters, setShowFilters] = useState(false)

  // Utiliser les props externes si fournies, sinon les états internes
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery
  const category = externalCategory !== undefined ? externalCategory : selectedCategory

  // Charger les catégories et produits
  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [searchQuery, category, sortBy, sortOrder, priceRange])

  const loadCategories = async () => {
    try {
      const cats = await categoriesService.getAll()
      setCategories(cats || [])
    } catch (error) {
      console.error("Erreur chargement catégories:", error)
    }
  }

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params: { 
        search?: string; 
        categorie_id?: number; 
        per_page: number;
        sort_by?: string;
        sort_order?: string;
        price_min?: number;
        price_max?: number;
      } = {
        per_page: 100
      }
      
      if (searchQuery) params.search = searchQuery
      if (category !== "all") params.categorie_id = parseInt(category)
      if (sortBy === "price") {
        params.sort_by = "prix_vente"
        params.sort_order = sortOrder
      }
      if (sortBy === "name") {
        params.sort_by = "nom"
        params.sort_order = sortOrder
      }
      if (priceRange.min > 0) params.price_min = priceRange.min
      if (priceRange.max < 1000) params.price_max = priceRange.max
      
      const response = await produitsService.getAll(params)
      setProducts(response.data || [])
      
      if (response.data?.length === 0 && searchQuery) {
        toast.info("Aucun résultat", {
          description: `Aucun produit trouvé pour "${searchQuery}"`
        })
      }
    } catch (err) {
      console.error("Erreur chargement produits:", err)
      setError("Impossible de charger les produits")
      toast.error("Erreur", {
        description: "Impossible de charger les produits"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = (product: Produit) => {
    const cartItem = {
      id: product.id,
      name: product.nom,
      price: product.prix_vente_actuel || 0,
      image: product.photo || "/placeholder.svg",
      category: product.categorie?.nom || "Produit",
      quantity: 1
    }
    addToCart(cartItem)
    toast.success("Ajouté au panier", {
      description: `${product.nom} a été ajouté au panier`
    })
  }

  const handleProductClick = (product: Produit) => {
    if (onProductSelect) {
      onProductSelect(product)
    } else {
      handleAddToCart(product)
    }
  }

  const clearSearch = () => {
    setLocalSearchQuery("")
  }

  const clearFilters = () => {
    setSelectedCategory("all")
    setSortBy("name")
    setSortOrder("asc")
    setPriceRange({ min: 0, max: 1000 })
    setLocalSearchQuery("")
  }

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // Filtre par prix
    result = result.filter(product => {
      const price = product.prix_vente_actuel || 0
      return price >= priceRange.min && price <= priceRange.max
    })

    return result
  }, [products, priceRange])

  if (isLoading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (error && products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={loadProducts}
          className="mt-2 text-emerald-500 hover:underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="sticky top-0 z-10 bg-background p-4 border-b">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => externalSearchQuery === undefined ? setLocalSearchQuery(e.target.value) : null}
                className="pl-9 pr-8"
                disabled={externalSearchQuery !== undefined}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-3 border-t">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Catégorie" />
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

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑ Croissant" : "↓ Décroissant"}
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Prix:</span>
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min || ""}
                  onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) || 0 })}
                  className="w-20 h-8"
                />
                <span>-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max || ""}
                  onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) || 1000 })}
                  className="w-20 h-8"
                />
              </div>

              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            </div>
          )}

          {/* Résultats de recherche */}
          {searchQuery && (
            <div className="text-sm text-muted-foreground">
              Résultats pour <span className="font-medium text-foreground">"{searchQuery}"</span> : {filteredAndSortedProducts.length} produit(s)
            </div>
          )}
        </div>
      </div>

      {/* Grille de produits */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 p-4">
        {filteredAndSortedProducts.map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer group"
            onClick={() => handleProductClick(product)}
          >
            <div className="relative aspect-square">
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 z-10">
                <PlusCircle className="h-10 w-10 text-white" />
              </div>
              {product.photo ? (
                <Image 
                  src={product.photo} 
                  alt={product.nom} 
                  fill 
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No image</span>
                </div>
              )}
              
              {/* Badge de stock */}
              {product.stock_actuel !== undefined && product.stock_actuel <= 5 && product.stock_actuel > 0 && (
                <div className="absolute top-2 left-2">
                  <Badge variant="destructive" className="text-xs">
                    Stock: {product.stock_actuel}
                  </Badge>
                </div>
              )}
              {product.stock_actuel === 0 && (
                <div className="absolute top-2 left-2">
                  <Badge variant="destructive" className="text-xs bg-red-600">
                    Rupture
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <div>
                <h3 className="font-medium line-clamp-1">{product.nom}</h3>
                <p className="text-sm text-muted-foreground">
                  {(product.prix_vente_actuel || 0).toFixed(2)} $
                </p>
                {product.categorie && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {product.categorie.nom}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAndSortedProducts.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || category !== "all" || priceRange.min > 0 || priceRange.max < 1000
                ? "Aucun produit ne correspond à vos critères"
                : "Aucun produit disponible"
              }
            </p>
            {(searchQuery || category !== "all" || priceRange.min > 0 || priceRange.max < 1000) && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Effacer tous les filtres
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}