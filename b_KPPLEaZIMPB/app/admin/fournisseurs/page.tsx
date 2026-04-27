"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Truck,
  Phone,
  MapPin,
  Building2,
} from "lucide-react"
import { toast } from "sonner"
import { fournisseursService, type Fournisseur } from "@/lib/api-services/fournisseurs"

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nom: "",
    adresse: "",
    ville: "",
    pays: "",
    contact: "",
  })

  useEffect(() => {
    loadFournisseurs()
  }, [])

  const loadFournisseurs = async () => {
    try {
      setIsLoading(true)
      const data = await fournisseursService.getAll()
      setFournisseurs(data)
    } catch (error) {
      console.error("Erreur chargement fournisseurs:", error)
      toast.error("Erreur", { description: "Impossible de charger les fournisseurs" })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredFournisseurs = fournisseurs.filter((f) =>
    f.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.ville && f.ville.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (f.contact && f.contact.includes(searchQuery))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nom.trim()) {
      toast.error("Erreur", { description: "Le nom du fournisseur est requis" })
      return
    }

    try {
      setIsSubmitting(true)

      if (editingFournisseur) {
        const updated = await fournisseursService.update(editingFournisseur.id, formData)
        if (updated) {
          setFournisseurs(fournisseurs.map(f => f.id === editingFournisseur.id ? updated : f))
          toast.success("Succès", { description: "Fournisseur modifié avec succès" })
        }
      } else {
        const newFournisseur = await fournisseursService.create(formData)
        if (newFournisseur) {
          setFournisseurs([...fournisseurs, newFournisseur])
          toast.success("Succès", { description: "Fournisseur ajouté avec succès" })
        }
      }
      resetForm()
      setShowAddDialog(false)
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur", { description: "Impossible de sauvegarder le fournisseur" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (fournisseur: Fournisseur) => {
    setEditingFournisseur(fournisseur)
    setFormData({
      nom: fournisseur.nom,
      adresse: fournisseur.adresse || "",
      ville: fournisseur.ville || "",
      pays: fournisseur.pays || "",
      contact: fournisseur.contact || "",
    })
    setShowAddDialog(true)
  }

  const handleDelete = async (id: number, nom: string) => {
    if (confirm(`Supprimer le fournisseur "${nom}" ?`)) {
      try {
        const success = await fournisseursService.delete(id)
        if (success) {
          setFournisseurs(fournisseurs.filter(f => f.id !== id))
          toast.success("Succès", { description: "Fournisseur supprimé avec succès" })
        }
      } catch (error) {
        console.error("Erreur suppression:", error)
        toast.error("Erreur", { description: "Impossible de supprimer le fournisseur" })
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      adresse: "",
      ville: "",
      pays: "",
      contact: "",
    })
    setEditingFournisseur(null)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Fournisseurs</h1>
          <p className="text-muted-foreground">Gérez vos fournisseurs</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un fournisseur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingFournisseur ? "Modifier le fournisseur" : "Ajouter un fournisseur"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom du fournisseur *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Société X"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Téléphone / Email"
                />
              </div>
              <div>
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Adresse complète"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    placeholder="Ville"
                  />
                </div>
                <div>
                  <Label htmlFor="pays">Pays</Label>
                  <Input
                    id="pays"
                    value={formData.pays}
                    onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                    placeholder="Pays"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingFournisseur ? "Modification..." : "Ajout..."}
                    </>
                  ) : (
                    editingFournisseur ? "Modifier" : "Ajouter"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un fournisseur..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fournisseurs Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredFournisseurs.map((fournisseur) => (
          <Card key={fournisseur.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{fournisseur.nom}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      ID: {fournisseur.id}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(fournisseur)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(fournisseur.id, fournisseur.nom)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {fournisseur.contact && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{fournisseur.contact}</span>
                </div>
              )}
              {(fournisseur.adresse || fournisseur.ville || fournisseur.pays) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="line-clamp-1">
                    {[fournisseur.adresse, fournisseur.ville, fournisseur.pays].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {!fournisseur.contact && !fournisseur.adresse && !fournisseur.ville && (
                <p className="text-sm text-muted-foreground">Aucune information supplémentaire</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFournisseurs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Aucun fournisseur trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Aucun fournisseur ne correspond à votre recherche" : "Commencez par ajouter votre premier fournisseur"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un fournisseur
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}