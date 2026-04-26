"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { PlusCircle, Loader2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useCart } from "../context/cart-context"
import { produitsService, type Produit } from "@/lib/api-services/produits"
import { toast } from "sonner"

interface ProductGridProps {
  category: string
  searchQuery: string
}

export default function ProductGrid({ category, searchQuery }: ProductGridProps) {
  const { addToCart } = useCart()
  const [products, setProducts] = useState<Produit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [category, searchQuery])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params: { search?: string; categorie_id?: number; per_page: number } = {
        per_page: 100
      }
      
      if (searchQuery) params.search = searchQuery
      if (category !== "all") params.categorie_id = parseInt(category)
      
      const response = await produitsService.getAll(params)
      setProducts(response.data || [])
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
    // Transformer le produit au format attendu par le panier
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (error) {
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <Card
          key={product.id}
          className="overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer group"
          onClick={() => handleAddToCart(product)}
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
          </div>
          <CardContent className="p-3">
            <div>
              <h3 className="font-medium line-clamp-1">{product.nom}</h3>
              <p className="text-sm text-muted-foreground">
                {(product.prix_vente_actuel || 0).toFixed(2)} $
              </p>
              {product.stock_actuel !== undefined && product.stock_actuel <= 5 && (
                <p className="text-xs text-red-500 mt-1">
                  Stock: {product.stock_actuel}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {products.length === 0 && (
        <div className="col-span-full py-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery || category !== "all" 
              ? "Aucun produit ne correspond à votre recherche" 
              : "Aucun produit disponible"
            }
          </p>
        </div>
      )}
    </div>
  )
}