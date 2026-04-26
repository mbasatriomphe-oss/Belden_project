"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Plus, User, Phone, Mail, Award, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "../context/cart-context"
import { clientsService } from "@/lib/api-services/clients"
import { toast } from "sonner"

// Définir les types
interface Customer {
  id: number
  nom: string
  email: string
  numero_tel?: string
  adress?: string
  points_fidelite?: number
  total_achete?: number
  nombre_commandes?: number
}

interface NewCustomer {
  nom: string
  email: string
  numero_tel: string
  adress: string
}

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CustomerModal({ isOpen, onClose }: CustomerModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    nom: "",
    email: "",
    numero_tel: "",
    adress: "",
  })
  const { customer, setCustomer } = useCart()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Charger les clients
  useEffect(() => {
    if (isOpen) {
      loadCustomers()
      // Réinitialiser le scroll quand le modal s'ouvre
      setShowAddForm(false)
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }
  }, [isOpen])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      const response = await clientsService.getAll({ per_page: 100 })
      
      if (response && response.data && Array.isArray(response.data)) {
        setCustomers(response.data as Customer[])
      } else if (response && Array.isArray(response)) {
        setCustomers(response as Customer[])
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error("Erreur chargement clients:", error)
      toast.error("Impossible de charger les clients")
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.trim()) {
      try {
        setIsLoading(true)
        const response = await clientsService.getAll({ search: query })
        if (response && response.data && Array.isArray(response.data)) {
          setCustomers(response.data as Customer[])
        } else if (response && Array.isArray(response)) {
          setCustomers(response as Customer[])
        } else {
          setCustomers([])
        }
      } catch (error) {
        console.error("Erreur recherche:", error)
        setCustomers([])
      } finally {
        setIsLoading(false)
      }
    } else {
      await loadCustomers()
    }
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.nom.trim()) {
      toast.error("Nom requis", {
        description: "Veuillez entrer le nom du client",
      })
      return
    }

    if (!newCustomer.email.trim()) {
      toast.error("Email requis", {
        description: "Veuillez entrer l'email du client",
      })
      return
    }

    try {
      setIsSaving(true)
      
      const customerData = {
        nom: newCustomer.nom,
        email: newCustomer.email,
        numero_tel: newCustomer.numero_tel || "",
        adress: newCustomer.adress || "",
      }
      
      const savedCustomer = await clientsService.create(customerData) as Customer
      
      if (savedCustomer) {
        toast.success("Client ajouté avec succès", {
          description: `${savedCustomer.nom} a été ajouté à la base de données`,
        })
        
        setNewCustomer({ nom: "", email: "", numero_tel: "", adress: "" })
        setShowAddForm(false)
        await loadCustomers()
      } else {
        toast.error("Erreur", {
          description: "Impossible d'ajouter le client",
        })
      }
    } catch (error: any) {
      console.error("Erreur ajout client:", error)
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectCustomer = (selectedCustomer: Customer) => {
    // Convertir le format backend vers le format attendu par le panier
    const cartCustomer = {
      id: selectedCustomer.id,
      name: selectedCustomer.nom,
      email: selectedCustomer.email,
      phone: selectedCustomer.numero_tel || "",
      loyaltyPoints: selectedCustomer.points_fidelite || 0,
      totalSpent: selectedCustomer.total_achete || 0,
      purchaseHistory: [],
    }
    setCustomer(cartCustomer as any)
    toast.success(`Client sélectionné: ${selectedCustomer.nom}`)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle>Gestion des clients</DialogTitle>
        </DialogHeader>

        {/* Zone de recherche fixe */}
        <div className="px-6 py-4 border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
          </div>
        </div>

        {/* Zone de formulaire (avec scroll si nécessaire) */}
        {showAddForm && (
          <div className="px-6 py-4 border-b max-h-[400px] overflow-y-auto">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ajouter un nouveau client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    value={newCustomer.nom}
                    onChange={(e) => setNewCustomer({ ...newCustomer, nom: e.target.value })}
                    placeholder="Ex: Jean Dupont"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="Ex: client@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={newCustomer.numero_tel}
                    onChange={(e) => setNewCustomer({ ...newCustomer, numero_tel: e.target.value })}
                    placeholder="Ex: +243 123 456 789"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={newCustomer.adress}
                    onChange={(e) => setNewCustomer({ ...newCustomer, adress: e.target.value })}
                    placeholder="Ex: Kinshasa, RDC"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleAddCustomer} disabled={isSaving} className="flex-1">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Zone de la liste des clients (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {/* Client actuellement sélectionné */}
          {customer && (
            <Card className="border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{(customer as any).name}</p>
                      <p className="text-sm text-muted-foreground">Client actuel</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setCustomer(null)}>
                    Retirer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des clients */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            customers.map((cust) => (
              <Card 
                key={cust.id} 
                className="cursor-pointer hover:bg-muted/50 transition" 
                onClick={() => handleSelectCustomer(cust)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{cust.nom}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {cust.email}
                          {cust.numero_tel && (
                            <>
                              <Phone className="h-3 w-3 ml-2" />
                              {cust.numero_tel}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        <Award className="h-3 w-3 mr-1" />
                        {cust.points_fidelite || 0} pts
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Dépensé: ${(cust.total_achete || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {!isLoading && customers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "Aucun client trouvé" : "Aucun client enregistré"}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}