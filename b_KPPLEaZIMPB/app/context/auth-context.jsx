"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/lib/api-services/auth"
import { useToast } from "@/hooks/use-toast"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Vérifier la session existante
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true)
        
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem("auth_token")
          console.log("Token trouvé dans localStorage:", token ? "Oui" : "Non")
          
          if (token) {
            authService.setToken(token)
            const response = await authService.getUser()
            console.log("Réponse getUser:", response)
            
            if (response.success && response.data) {
              setUser(response.data)
            } else {
              // Token invalide
              localStorage.removeItem("auth_token")
            }
          }
        }
      } catch (error) {
        console.error("Session check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  // Logique de redirection
  useEffect(() => {
    if (isLoading) return

    const isLoginPage = pathname === "/login"
    const isAdminRoute = pathname?.startsWith("/admin")

    console.log("Redirection check - user:", user?.post_nom, "isLoginPage:", isLoginPage)

    if (!user && !isLoginPage) {
      router.push("/login")
    } else if (user && isLoginPage) {
      router.push("/")
    } else if (user && isAdminRoute && user.role !== "admin") {
      router.push("/access-denied")
    }
  }, [user, isLoading, pathname, router])

  const login = async (post_nom, password) => {
    console.log("🔐 Tentative login avec:", post_nom)
    
    try {
      setIsLoading(true)
      
      const response = await authService.login({ post_nom, password })
      console.log("📥 Réponse login complète:", response)
      
      if (response.success && response.user) {
        const userData = response.user
        console.log("✅ Login réussi pour:", userData.post_nom)
        
        setUser(userData)
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${userData.nom}`,
        })
        
        router.push("/dashboard")
        return { success: true, user: userData }
        
      } else {
        console.log("❌ Login échoué:", response.error || response.message)
        toast({
          title: "Erreur de connexion",
          description: response.error || response.message || "Identifiants invalides",
          variant: "destructive",
        })
        return { success: false, error: response.error || response.message || "Identifiants invalides" }
      }
      
    } catch (error) {
      console.error("❌ Erreur login:", error)
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      })
      return { success: false, error: error.message || "Erreur de connexion" }
      
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await authService.logout()
      setUser(null)
      router.push("/login")
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté",
      })
    } catch (error) {
      console.error("Logout error:", error)
      setUser(null)
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  const isAdmin = () => user?.role === "admin"
  const isVendeur = () => user?.role === "vendeur"

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin,
        isVendeur,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}