import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "./context/cart-context"
import { AuthProvider } from "./context/auth-context"
import { ThemeProvider } from "./context/theme-context"
import { SettingsProvider } from "./context/settings-context"
import { Toaster } from "sonner"
// import Header from "./components/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gestion de Stock - POS System",
  description: "Système professionnel de gestion de stock et point de vente",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} bg-background`}>
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <CartProvider>
                <div className="min-h-screen flex flex-col">
                  {/* <Header/> */}
                  <main className="flex-1">
                    {children}
                  </main>
                </div>
                <Toaster position="top-right" richColors />
              </CartProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}