"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LayoutGrid, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { categoriesService, type Categorie } from "@/lib/api-services/categories"
import Image from "next/image"

interface CategorySidebarProps {
  selectedCategory: string
  onSelectCategory: (categoryId: string) => void
}

interface CategoryItem {
  id: string
  name: string
  image: string | null
  originalId: number
}

export default function CategorySidebar({ selectedCategory, onSelectCategory }: CategorySidebarProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const data = await categoriesService.getAll()
      
      const formattedCategories: CategoryItem[] = [
        {
          id: "all",
          name: "Tous les produits",
          image: null,
          originalId: 0,
        },
        ...data.map((cat) => ({
          id: cat.id.toString(),
          name: cat.nom,
          image: cat.photo,
          originalId: cat.id,
        })),
      ]
      
      setCategories(formattedCategories)
    } catch (err) {
      console.error("Erreur chargement catégories:", err)
      setError("Impossible de charger les catégories")
      setCategories([
        {
          id: "all",
          name: "Tous les produits",
          image: null,
          originalId: 0,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-56 border-r bg-background p-4">
        <h2 className="mb-4 text-lg font-semibold">Catégories</h2>
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-56 border-r bg-background p-4 overflow-y-auto">
      <h2 className="mb-4 text-lg font-semibold">Catégories</h2>
      <div className="grid gap-3">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant="ghost"
            className={cn(
              "flex h-auto items-center justify-start gap-3 py-3 px-4 border bg-transparent",
              selectedCategory === category.id
                ? "border-2 border-primary text-foreground font-medium"
                : "border-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground",
              "hover:bg-transparent"
            )}
            onClick={() => onSelectCategory(category.id)}
          >
            {category.image ? (
              <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutGrid className="h-4 w-4 text-primary" />
              </div>
            )}
            <span className="text-sm">{category.name}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}