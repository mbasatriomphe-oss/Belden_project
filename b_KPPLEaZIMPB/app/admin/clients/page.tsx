"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../context/auth-context"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Search,
  Users,
  TrendingUp,
  DollarSign,
  ArrowUpDown,
  Eye,
  Star,
  Phone,
  Mail,
  Loader2,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { clientsService, type Client } from "@/lib/api-services/clients"

export default function ClientsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("total_achete")
  const [sortOrder, setSortOrder] = useState("desc")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nom: "",
    numero_tel: "",
    adress: "",
    email: "",
  })

  // Charger les clients
  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setIsLoading(true)
      console.log("Chargement des clients...")
      
      const response = await clientsService.getAll({
        per_page: 100
      })
      
      console.log("Réponse reçue:", response)
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log(`${response.data.length} clients chargés`)
        setClients(response.data)
      } else {
        console.log("Aucun client trouvé ou format incorrect")
        setClients([])
      }
    } catch (error) {
      console.error("Erreur chargement clients:", error)
      toast.error("Impossible de charger les clients", {
        description: "Vérifiez votre connexion au serveur",
      })
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrer et trier les clients
  const filteredClients = useMemo(() => {
    if (!clients || !Array.isArray(clients)) {
      return []
    }
    
    let result = [...clients]

    // Filtre de recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (client) =>
          client.nom.toLowerCase().includes(query) ||
          (client.email && client.email.toLowerCase().includes(query)) ||
          (client.numero_tel && client.numero_tel.includes(query))
      )
    }

    // Tri
    result.sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortBy === "total_achete") {
        aValue = a.total_achete || 0;
        bValue = b.total_achete || 0;
      } else if (sortBy === "nombre_commandes") {
        aValue = a.nombre_commandes || 0;
        bValue = b.nombre_commandes || 0;
      } else if (sortBy === "nom") {
        aValue = a.nom || "";
        bValue = b.nom || "";
      } else if (sortBy === "points_fidelite") {
        aValue = a.points_fidelite || 0;
        bValue = b.points_fidelite || 0;
      } else {
        aValue = (a as any)[sortBy] || 0;
        bValue = (b as any)[sortBy] || 0;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    })

    return result
  }, [clients, searchQuery, sortBy, sortOrder])

  // Stats calculées
  const stats = useMemo(() => {
    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return { totalClients: 0, totalRevenue: 0, avgSpent: 0, vipClients: 0 }
    }
    
    const totalClients = clients.length
    const totalRevenue = clients.reduce((sum, c) => sum + (c.total_achete || 0), 0)
    const avgSpent = totalClients > 0 ? totalRevenue / totalClients : 0
    const vipClients = clients.filter((c) => (c.total_achete || 0) > 1000).length
    return { totalClients, totalRevenue, avgSpent, vipClients }
  }, [clients])

  const getStatusBadge = (client: Client) => {
    const totalSpent = client.total_achete || 0;
    if (totalSpent > 1000) {
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">VIP</Badge>
    }
    if ((client.nombre_commandes || 0) > 0) {
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Actif</Badge>
    }
    return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Inactif</Badge>
  }

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client)
    setShowDetails(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nom.trim()) {
      toast.error("Nom requis", {
        description: "Veuillez entrer le nom du client",
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (editingClient) {
        // Mise à jour
        const updated = await clientsService.update(editingClient.id, formData)
        if (updated) {
          setClients(prev => prev.map(c => c.id === editingClient.id ? updated : c))
          toast.success("Client modifié avec succès", {
            description: `${updated.nom} a été mis à jour`,
          })
          resetForm()
          setShowAddDialog(false)
          loadClients()
        } else {
          toast.error("Erreur", {
            description: "Impossible de modifier le client",
          })
        }
      } else {
        // Création
        const newClient = await clientsService.create(formData)
        if (newClient) {
          setClients(prev => [...prev, newClient])
          toast.success(`Client enregistré avec succès !`, {
            description: `${newClient.nom} a été ajouté à la base de données`,
          })
          resetForm()
          setShowAddDialog(false)
          loadClients()
        } else {
          toast.error("Erreur d'enregistrement", {
            description: "Vérifiez les informations du client",
          })
        }
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de l'enregistrement",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      nom: client.nom,
      numero_tel: client.numero_tel || "",
      adress: client.adress || "",
      email: client.email || "",
    })
    setShowAddDialog(true)
  }

  const handleDelete = async (clientId: number, clientName: string) => {
    toast.warning("Confirmation", {
      description: `Voulez-vous vraiment supprimer "${clientName}" ?`,
      action: {
        label: "Supprimer",
        onClick: async () => {
          try {
            const success = await clientsService.delete(clientId)
            if (success) {
              setClients(prev => prev.filter((c) => c.id !== clientId))
              toast.success("Client supprimé", {
                description: `${clientName} a été supprimé`,
              })
              loadClients()
            }
          } catch (error) {
            toast.error("Erreur", {
              description: "Impossible de supprimer le client",
            })
          }
        },
      },
      cancel: {
        label: "Annuler",
      },
    })
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      numero_tel: "",
      adress: "",
      email: "",
    })
    setEditingClient(null)
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Clients</h1>
              <p className="text-sm text-muted-foreground">Gérez votre base de clients</p>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingClient ? "Modifier le client" : "Ajouter un nouveau client"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nom">Nom complet *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Jean Dupont"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="numero_tel">Téléphone</Label>
                  <Input
                    id="numero_tel"
                    value={formData.numero_tel}
                    onChange={(e) => setFormData({ ...formData, numero_tel: e.target.value })}
                    placeholder="Ex: +243 123 456 789"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="adress">Adresse</Label>
                  <Input
                    id="adress"
                    value={formData.adress}
                    onChange={(e) => setFormData({ ...formData, adress: e.target.value })}
                    placeholder="Ex: Kinshasa, RDC"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: client@email.com"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingClient ? "Modification..." : "Enregistrement..."}
                      </>
                    ) : (
                      editingClient ? "Modifier" : "Enregistrer"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    resetForm()
                    setShowAddDialog(false)
                  }}>
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalRevenue.toFixed(2)} $</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Moyenne par client</p>
                  <p className="text-2xl font-bold text-foreground">{stats.avgSpent.toFixed(2)} $</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clients VIP</p>
                  <p className="text-2xl font-bold text-foreground">{stats.vipClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_achete">Total dépensé</SelectItem>
                  <SelectItem value="nombre_commandes">Nombre commandes</SelectItem>
                  <SelectItem value="points_fidelite">Points fidélité</SelectItem>
                  <SelectItem value="nom">Nom</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="shrink-0"
              >
                <ArrowUpDown className={`h-4 w-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des clients */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des clients ({filteredClients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucun client trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Aucun client ne correspond à votre recherche" : "Commencez par ajouter votre premier client"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un client
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Commandes</TableHead>
                      <TableHead className="text-right">Total dépensé</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{client.nom}</p>
                            <p className="text-sm text-muted-foreground">{client.email || client.numero_tel || "Pas de contact"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(client)}</TableCell>
                        <TableCell className="text-right">{client.nombre_commandes || 0}</TableCell>
                        <TableCell className="text-right font-medium">
                          {(client.total_achete || 0).toFixed(2)} $
                        </TableCell>
                        <TableCell className="text-right">{client.points_fidelite || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(client)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(client.id, client.nom)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal détails client */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du client</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedClient.nom.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedClient.nom}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    {selectedClient.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {selectedClient.email}
                      </span>
                    )}
                    {selectedClient.numero_tel && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {selectedClient.numero_tel}
                      </span>
                    )}
                  </div>
                  {selectedClient.adress && (
                    <p className="text-sm text-muted-foreground mt-2">
                      📍 {selectedClient.adress}
                    </p>
                  )}
                </div>
                {getStatusBadge(selectedClient)}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-600">{selectedClient.nombre_commandes || 0}</p>
                  <p className="text-xs text-muted-foreground">Commandes</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-600">{(selectedClient.total_achete || 0).toFixed(0)} $</p>
                  <p className="text-xs text-muted-foreground">Total dépensé</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-600">{selectedClient.points_fidelite || 0}</p>
                  <p className="text-xs text-muted-foreground">Points fidélité</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}