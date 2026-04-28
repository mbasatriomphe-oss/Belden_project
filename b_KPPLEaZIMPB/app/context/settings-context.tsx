"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface Settings {
  quickActionsEnabled: boolean;
  clientPageEnabled: boolean;
  soundEnabled: boolean;
  autoLogout: number;
  currency: string;
  currencySymbol: string;
  taxRate: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: any) => void;
  toggleQuickActions: () => void;
  toggleClientPage: () => void;
  toggleSound: () => void;
}

const defaultSettings: Settings = {
  quickActionsEnabled: true,
  clientPageEnabled: true,
  soundEnabled: true,
  autoLogout: 30,
  currency: "USD",
  currencySymbol: "$",
  taxRate: 10,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedSettings = localStorage.getItem("pos_settings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings((prev) => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error("Failed to parse settings:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("pos_settings", JSON.stringify(settings))
    }
  }, [settings, mounted])

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const toggleQuickActions = () => {
    setSettings((prev) => ({
      ...prev,
      quickActionsEnabled: !prev.quickActionsEnabled,
    }))
  }

  const toggleClientPage = () => {
    setSettings((prev) => ({
      ...prev,
      clientPageEnabled: !prev.clientPageEnabled,
    }))
  }

  const toggleSound = () => {
    setSettings((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }))
  }

  if (!mounted) {
    return null
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        toggleQuickActions,
        toggleClientPage,
        toggleSound,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}