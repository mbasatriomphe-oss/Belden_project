"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Wallet, AlertCircle, CheckCircle2, Info, Edit2, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "../context/cart-context"
import { useAuth } from "../context/auth-context"
import { commandesService } from "@/lib/api-services/commandes"
import { toast } from "sonner"

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  totalSpent: number;
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, cartTotal, clearCart, customer, discountAmount, updateItemPrice } = useCart()
  const { user, isLoading: authLoading } = useAuth()
  
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingItem, setEditingItem] = useState<number | null>(null)
  const [editPrice, setEditPrice] = useState<number>(0)
  
  // États pour les items modifiés
  const [modifiedItems, setModifiedItems] = useState<{ id: number; newPrice: number }[]>([])
  
  // États pour le paiement
  const [paymentAmount, setPaymentAmount] = useState("")
  
  // États pour la carte (optionnel)
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardError, setCardError] = useState("")

  // Calculer le total avec les prix modifiés
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const modified = modifiedItems.find(m => m.id === item.id)
      const price = modified ? modified.newPrice : item.price
      return sum + (price * item.quantity)
    }, 0)
  }

  const subtotal = calculateSubtotal()
  const grandTotal = subtotal - discountAmount

  // Initialiser le montant de paiement
  useEffect(() => {
    setPaymentAmount(grandTotal.toFixed(2))
  }, [grandTotal])

  // Modifier le prix d'un produit
  const handleEditPrice = (item: CartItem) => {
    setEditingItem(item.id)
    const modified = modifiedItems.find(m => m.id === item.id)
    setEditPrice(modified ? modified.newPrice : item.price)
  }

  const handleSavePrice = (itemId: number) => {
    if (editPrice <= 0) {
      toast.error("Prix invalide", { description: "Le prix doit être supérieur à 0" })
      return
    }
    
    setModifiedItems(prev => {
      const existing = prev.find(m => m.id === itemId)
      if (existing) {
        return prev.map(m => m.id === itemId ? { ...m, newPrice: editPrice } : m)
      }
      return [...prev, { id: itemId, newPrice: editPrice }]
    })
    
    updateItemPrice(itemId, editPrice)
    setEditingItem(null)
    toast.success("Prix modifié", { description: "Le prix a été mis à jour" })
  }

  const cancelEdit = () => {
    setEditingItem(null)
  }

  // Formater numéro de carte
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) return parts.join(" ")
    return value
  }

  // Formater date d'expiration
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4)
    }
    return v
  }

  // Valider la carte
  const validateCard = () => {
    if (paymentMethod !== "card") return true
    
    const cardNumClean = cardNumber.replace(/\s/g, "")
    if (cardNumClean.length < 13 || cardNumClean.length > 19) {
      setCardError("Numéro de carte invalide")
      return false
    }
    
    if (!cardExpiry || cardExpiry.length !== 5) {
      setCardError("Date d'expiration invalide (MM/YY)")
      return false
    }
    
    if (!cardCvv || cardCvv.length < 3) {
      setCardError("CVV invalide")
      return false
    }
    
    if (!cardName.trim()) {
      setCardError("Nom du titulaire requis")
      return false
    }
    
    setCardError("")
    return true
  }

  const handlePayment = async () => {
    const amountPaid = parseFloat(paymentAmount)
    if (isNaN(amountPaid) || amountPaid <= 0) {
      toast.error("Montant invalide", { description: "Veuillez entrer un montant valide" })
      return
    }
    
    if (!validateCard()) return
    
    setIsProcessing(true)

    try {
      // Préparer les items de la commande
      const orderItems = cart.map(item => {
        const modified = modifiedItems.find(m => m.id === item.id)
        const price = modified ? modified.newPrice : item.price
        return {
          produit_id: item.id,
          quantite: item.quantity,
          prix_vente: price
        }
      })

      // Calculer le montant payé (ne peut pas dépasser le total)
      const totalPaid = Math.min(amountPaid, grandTotal)
      const soldeRestant = grandTotal - totalPaid
      
      // Créer la commande dans Laravel
      const response = await commandesService.create({
        date_commande: new Date().toISOString(),
        client_id: customer?.id ? parseInt(customer.id) : null,
        items: orderItems,
        remise: discountAmount,
        montant_paye: totalPaid,
      })

      if (response.success) {
        // Récupérer l'ID de la commande
        const commandeId = (response.data as any)?.commande?.id || (response.data as any)?.id
        
        // Enregistrer la transaction dans la caisse
        const cashRegisterTransaction = {
          id: Date.now().toString(),
          type: "vente",
          amount: totalPaid,
          paymentMethod: paymentMethod,
          orderId: commandeId,
          date: new Date().toISOString(),
          processedBy: (user as any)?.nom || (user as any)?.name || "Admin",
          remainingDebt: soldeRestant > 0 ? soldeRestant : 0,
          statut_paiement: soldeRestant > 0 ? "partiellement_paye" : "paye"
        }

        // Sauvegarder dans localStorage (caisse)
        const savedTransactions = localStorage.getItem("cash_register")
        const transactions = savedTransactions ? JSON.parse(savedTransactions) : []
        transactions.push(cashRegisterTransaction)
        localStorage.setItem("cash_register", JSON.stringify(transactions))

        // Si solde restant > 0, enregistrer dans la liste des débiteurs
        if (soldeRestant > 0 && customer) {
          const debtors = JSON.parse(localStorage.getItem("debtors") || "[]")
          const existingDebtor = debtors.find((d: any) => d.clientId === customer.id)
          
          if (existingDebtor) {
            existingDebtor.amount += soldeRestant
            existingDebtor.lastUpdate = new Date().toISOString()
          } else {
            debtors.push({
              id: Date.now().toString(),
              clientId: customer.id,
              clientName: customer.name,
              amount: soldeRestant,
              date: new Date().toISOString(),
              status: "impayé",
              orderId: commandeId
            })
          }
          localStorage.setItem("debtors", JSON.stringify(debtors))
          
          toast.warning("Paiement partiel enregistré", {
            description: `Solde restant: ${soldeRestant.toFixed(2)} $. Ce montant a été ajouté à la liste des débiteurs.`
          })
        } else {
          toast.success("Paiement effectué avec succès", {
            description: "Merci pour votre achat"
          })
        }

        clearCart()
        
        // Rediriger vers la page de succès
        router.push(`/success?amount=${totalPaid}&remaining=${soldeRestant}&orderId=${commandeId}&statut=${soldeRestant > 0 ? "partiel" : "complet"}`)
      } else {
        throw new Error(response.error || "Erreur lors de la création de la commande")
      }
    } catch (error: any) {
      console.error("Erreur paiement:", error)
      toast.error("Erreur", { description: error.message || "Une erreur est survenue lors du paiement" })
    } finally {
      setIsProcessing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  if (cart.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Votre panier est vide</h1>
          <p className="mt-2 text-muted-foreground">Ajoutez des produits avant de procéder au paiement</p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Retour au point de vente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <h1 className="mb-6 text-3xl font-bold text-foreground">Paiement</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Résumé de la commande */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Résumé de la commande</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cart.map((item) => {
                    const modified = modifiedItems.find(m => m.id === item.id)
                    const currentPrice = modified ? modified.newPrice : item.price
                    const isEditing = editingItem === item.id
                    
                    return (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                                  className="w-24 h-8 text-sm"
                                />
                                <Button size="sm" variant="ghost" onClick={() => handleSavePrice(item.id)}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {currentPrice.toFixed(2)} $ x {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleEditPrice(item)}
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="font-medium text-foreground">
                          {(currentPrice * item.quantity).toFixed(2)} $
                        </p>
                      </div>
                    )
                  })}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-foreground">
                    <p>Sous-total</p>
                    <p>{subtotal.toFixed(2)} $</p>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <p>Réduction</p>
                      <p>-{discountAmount.toFixed(2)} $</p>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <p>Total</p>
                    <p>{grandTotal.toFixed(2)} $</p>
                  </div>
                </div>

                {customer && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{customer.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Montant à payer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Montant à payer
                  <span className="text-xs font-normal text-muted-foreground">
                    (Paiement partiel possible)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Montant payé</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={grandTotal}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-7 text-lg font-semibold"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(grandTotal.toFixed(2))}
                    className={parseFloat(paymentAmount) === grandTotal ? "border-primary bg-primary/10" : ""}
                  >
                    Montant total
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount((grandTotal / 2).toFixed(2))}
                  >
                    50%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount((grandTotal / 4).toFixed(2))}
                  >
                    25%
                  </Button>
                </div>

                {parseFloat(paymentAmount) < grandTotal && parseFloat(paymentAmount) > 0 && (
                  <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      Paiement partiel de <strong>{parseFloat(paymentAmount).toFixed(2)} $</strong>. 
                      Solde restant: <strong>{(grandTotal - parseFloat(paymentAmount)).toFixed(2)} $</strong>
                      {customer && " - Cette dette sera enregistrée"}
                    </AlertDescription>
                  </Alert>
                )}

                {parseFloat(paymentAmount) >= grandTotal && parseFloat(paymentAmount) > 0 && (
                  <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                      Paiement complet - aucun solde restant
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Méthode de paiement */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Méthode de paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className={`flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === "cash" ? "border-primary bg-primary/5" : ""
                  }`}>
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center cursor-pointer flex-1">
                      <Wallet className="mr-2 h-5 w-5" />
                      Espèces
                    </Label>
                  </div>

                  <div className={`mt-3 flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === "card" ? "border-primary bg-primary/5" : ""
                  }`}>
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Carte bancaire
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Détails de la carte */}
            {paymentMethod === "card" && (
              <Card>
                <CardHeader>
                  <CardTitle>Informations carte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cardError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{cardError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Numéro de carte</Label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nom du titulaire</Label>
                    <Input
                      placeholder="Jean Dupont"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date d'expiration</Label>
                      <Input
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input
                        placeholder="123"
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        maxLength={4}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bouton de paiement */}
            <Button
              className="w-full h-14 text-lg font-semibold"
              size="lg"
              onClick={handlePayment}
              disabled={isProcessing || parseFloat(paymentAmount) <= 0}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Traitement en cours...
                </div>
              ) : (
                `Payer ${parseFloat(paymentAmount).toFixed(2)} $`
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Les informations de paiement sont sécurisées et cryptées
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}