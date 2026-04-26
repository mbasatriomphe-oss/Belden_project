"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Plus, Edit, Trash2, Package, MoreHorizontal, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { categoriesService, type Categorie } from "@/lib/api-services/categories"
import Image from "next/image"

const getCategoryIcon = (name: string): string => {
  const icons: Record<string, string> = {
    'Food': '🍽️',
    'Drinks': '🥤',
    'Desserts': '🍰',
    'Snacks': '🍿',
    'Boissons': '🥤',
    'Nourriture': '🍽️'
  }
  return icons[name] || '📦'
}

const getCategoryColor = (name: string): string => {
  const colors: Record<string, string> = {
    'Food': '#ef4444',
    'Drinks': '#3b82f6',
    'Desserts': '#f59e0b',
    'Snacks': '#10b981',
    'Boissons': '#3b82f6',
    'Nourriture': '#ef4444'
  }
  return colors[name] || '#6366f1'
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Categorie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const data = await categoriesService.getAll()
      setCategories(data)
    } catch (error) {
      console.error("Erreur chargement catégories:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
      toast({
        title: "Erreur",
        description: "Le nom de la catégorie est requis",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const formDataToSend = new FormData()
      formDataToSend.append('nom', formData.nom)
      if (formData.description) formDataToSend.append('description', formData.description)
      if (selectedImage) formDataToSend.append('photo', selectedImage)

      let result: Categorie | null = null

      if (editingCategory) {
        formDataToSend.append('_method', 'PUT')
        result = await categoriesService.updateWithImage(editingCategory.id, formDataToSend)
        if (result) {
          setCategories(categories.map(c => c.id === editingCategory.id ? result : c))
          toast({ title: "Succès", description: "Catégorie modifiée avec succès" })
        }
      } else {
        result = await categoriesService.createWithImage(formDataToSend)
        if (result) {
          setCategories([...categories, result])
          toast({ title: "Succès", description: "Catégorie ajoutée avec succès" })
        }
      }

      resetForm()
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la catégorie",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (category: Categorie) => {
    setEditingCategory(category)
    setFormData({
      nom: category.nom,
      description: category.description || "",
    })
    if (category.photo) {
      setImagePreview(category.photo)
    }
    setShowAddDialog(true)
  }

  const handleDelete = async (categoryId: number, categoryName: string) => {
    if (confirm(`Supprimer la catégorie "${categoryName}" ?`)) {
      try {
        const success = await categoriesService.delete(categoryId)
        if (success) {
          setCategories(categories.filter((c) => c.id !== categoryId))
          toast({ title: "Succès", description: "Catégorie supprimée avec succès" })
        }
      } catch (error) {
        console.error("Erreur suppression:", error)
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la catégorie",
          variant: "destructive",
        })
      }
    }
  }

  const resetForm = () => {
    setFormData({ nom: "", description: "" })
    setSelectedImage(null)
    setImagePreview(null)
    setEditingCategory(null)
    setShowAddDialog(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Catégories</h1>
          <p className="text-muted-foreground">Organisez vos produits par catégories</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Modifier la catégorie" : "Ajouter une nouvelle catégorie"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom de la catégorie</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Alimentation, Boissons, Desserts"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la catégorie"
                  rows={3}
                />
              </div>

              <div>
                <Label>Image de la catégorie</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Cliquez ou glissez une image ici
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, JPEG, WEBP (max 2MB)
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

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingCategory ? "Modification..." : "Ajout..."}
                    </>
                  ) : (
                    editingCategory ? "Modifier" : "Ajouter"
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => {
          const icon = getCategoryIcon(category.nom)
          const color = getCategoryColor(category.nom)
          
          return (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {category.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.photo}
                        alt={category.nom}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                        style={{ backgroundColor: color }}
                      >
                        {icon}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{category.nom}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        0 produits
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(category)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(category.id, category.nom)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {category.description || "Aucune description"}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Aucune catégorie trouvée</h3>
            <p className="text-muted-foreground mb-4">Commencez par ajouter votre première catégorie</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une catégorie
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}