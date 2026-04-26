"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Package, MoreHorizontal, Scale, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { unitesService, type Unite } from "@/lib/api-services/unites"

export default function UnitesPage() {
  const [unites, setUnites] = useState<Unite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingUnite, setEditingUnite] = useState<Unite | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    abreviation: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Charger les unités au démarrage
  useEffect(() => {
    loadUnites()
  }, [])

  const loadUnites = async () => {
    try {
      setIsLoading(true)
      const data = await unitesService.getAll()
      setUnites(data)
    } catch (error) {
      console.error("Erreur chargement unités:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les unités",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nom.trim() || !formData.abreviation.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (editingUnite) {
        // Mise à jour
        const updated = await unitesService.update(editingUnite.id, formData)
        if (updated) {
          setUnites(unites.map(u => u.id === editingUnite.id ? updated : u))
          toast({
            title: "Succès",
            description: "Unité modifiée avec succès",
          })
        }
      } else {
        // Création
        const newUnite = await unitesService.create(formData)
        if (newUnite) {
          setUnites([...unites, newUnite])
          toast({
            title: "Succès",
            description: "Unité ajoutée avec succès",
          })
        }
      }

      resetForm()
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'unité",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (unite: Unite) => {
    setEditingUnite(unite)
    setFormData({
      nom: unite.nom,
      abreviation: unite.abreviation,
    })
    setShowAddDialog(true)
  }

  const handleDelete = async (uniteId: number, uniteNom: string) => {
    if (confirm(`Supprimer l'unité "${uniteNom}" ?`)) {
      try {
        const success = await unitesService.delete(uniteId)
        if (success) {
          setUnites(unites.filter((u) => u.id !== uniteId))
          toast({
            title: "Succès",
            description: "Unité supprimée avec succès",
          })
        }
      } catch (error) {
        console.error("Erreur suppression:", error)
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'unité",
          variant: "destructive",
        })
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      abreviation: "",
    })
    setEditingUnite(null)
    setShowAddDialog(false)
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Unités de Mesure</h1>
          <p className="text-muted-foreground">Gérez les unités comme kg, mètre, litre, pièce, etc.</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une unité
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUnite ? "Modifier l'unité" : "Ajouter une nouvelle unité"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom de l'unité</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Kilogramme, Mètre, Litre"
                  required
                />
              </div>

              <div>
                <Label htmlFor="abreviation">Abréviation</Label>
                <Input
                  id="abreviation"
                  value={formData.abreviation}
                  onChange={(e) => setFormData({ ...formData, abreviation: e.target.value })}
                  placeholder="Ex: kg, m, L, pc"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingUnite ? "Modification..." : "Ajout..."}
                    </>
                  ) : (
                    editingUnite ? "Modifier" : "Ajouter"
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

      {/* Units Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {unites.map((unite) => (
          <Card key={unite.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {unite.nom} <span className="text-muted-foreground text-sm font-normal">({unite.abreviation})</span>
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      ID: {unite.id}
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
                    <DropdownMenuItem onClick={() => handleEdit(unite)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(unite.id, unite.nom)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  Unité de mesure
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Abréviation: {unite.abreviation}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {unites.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Aucune unité trouvée</h3>
            <p className="text-muted-foreground mb-4">Commencez par ajouter votre première unité de mesure</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une unité
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}