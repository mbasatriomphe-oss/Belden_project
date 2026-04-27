"use client"

import { useState, useEffect } from "react"

export default function TestProduitsPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le token
        let token = localStorage.getItem('auth_token')
        
        // Si pas de token, faire login
        if (!token) {
          console.log("Pas de token, tentative de login...")
          const loginRes = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_nom: "admin", password: "admin123" })
          })
          const loginData = await loginRes.json()
          if (loginData.token) {
            token = loginData.token
            localStorage.setItem('auth_token', token)
            console.log("Token récupéré")
          }
        }
        
        // Appel API produits
        const response = await fetch('http://localhost:8000/api/produits', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
        
        const result = await response.json()
        console.log("Résultat:", result)
        setData(result)
      } catch (err: any) {
        console.error("Erreur:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  if (loading) return <div className="p-8">Chargement...</div>
  if (error) return <div className="p-8 text-red-500">Erreur: {error}</div>
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test API Produits</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-black">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}