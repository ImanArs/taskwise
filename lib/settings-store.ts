"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface WorkSchedule {
  startTime: string
  endTime: string
  breakDuration: number
  lunchBreak: boolean
  lunchStart: string
  lunchDuration: number
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
}

export interface NotificationSettings {
  taskReminders: boolean
  breakReminders: boolean
  dailySummary: boolean
  weeklyReport: boolean
}

export interface AIPreferences {
  energyPattern: "morning" | "afternoon" | "evening" | "flexible"
  schedulingStyle: "aggressive" | "balanced" | "relaxed" | "custom"
  breakFrequency: number
}

interface SettingsStore {
  // Work Schedule
  workSchedule: WorkSchedule
  updateWorkSchedule: (schedule: Partial<WorkSchedule>) => void

  // AI Preferences
  aiPreferences: AIPreferences
  updateAIPreferences: (preferences: Partial<AIPreferences>) => void

  // Categories
  categories: Category[]
  addCategory: (category: Omit<Category, "id">) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void

  // Notifications
  notifications: NotificationSettings
  updateNotifications: (notifications: Partial<NotificationSettings>) => void

  // Theme & UI
  theme: "light" | "dark" | "system"
  setTheme: (theme: "light" | "dark" | "system") => void

  // Data Management
  exportData: () => string
  importData: (data: string) => boolean
  clearAllData: () => void
}

const defaultWorkSchedule: WorkSchedule = {
  startTime: "09:00",
  endTime: "17:00",
  breakDuration: 15,
  lunchBreak: true,
  lunchStart: "12:00",
  lunchDuration: 60,
}

const defaultCategories: Category[] = [
  { id: "1", name: "Work", color: "#6366f1", icon: "💼" },
  { id: "2", name: "Personal", color: "#ec4899", icon: "🏠" },
  { id: "3", name: "Health", color: "#10b981", icon: "💪" },
  { id: "4", name: "Learning", color: "#8b5cf6", icon: "📚" },
]

const defaultAIPreferences: AIPreferences = {
  energyPattern: "morning",
  schedulingStyle: "balanced",
  breakFrequency: 90,
}

const defaultNotifications: NotificationSettings = {
  taskReminders: true,
  breakReminders: true,
  dailySummary: true,
  weeklyReport: false,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Work Schedule
      workSchedule: defaultWorkSchedule,
      updateWorkSchedule: (schedule) =>
        set((state) => ({
          workSchedule: { ...state.workSchedule, ...schedule },
        })),

      // AI Preferences
      aiPreferences: defaultAIPreferences,
      updateAIPreferences: (preferences) =>
        set((state) => ({
          aiPreferences: { ...state.aiPreferences, ...preferences },
        })),

      // Categories
      categories: defaultCategories,
      addCategory: (categoryData) => {
        const newCategory: Category = {
          ...categoryData,
          id: Date.now().toString(),
        }
        set((state) => ({
          categories: [...state.categories, newCategory],
        }))
      },
      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat
          ),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        })),

      // Notifications
      notifications: defaultNotifications,
      updateNotifications: (notifications) =>
        set((state) => ({
          notifications: { ...state.notifications, ...notifications },
        })),

      // Theme & UI
      theme: "system",
      setTheme: (theme) => set({ theme }),

      // Data Management
      exportData: () => {
        const state = get()
        const exportObject = {
          workSchedule: state.workSchedule,
          aiPreferences: state.aiPreferences,
          categories: state.categories,
          notifications: state.notifications,
          theme: state.theme,
          exportDate: new Date().toISOString(),
          version: "1.0",
        }
        return JSON.stringify(exportObject, null, 2)
      },

      importData: (data) => {
        try {
          const imported = JSON.parse(data)
          
          // Validate structure
          if (!imported.workSchedule || !imported.categories) {
            return false
          }

          set({
            workSchedule: { ...defaultWorkSchedule, ...imported.workSchedule },
            aiPreferences: { ...defaultAIPreferences, ...imported.aiPreferences },
            categories: imported.categories || defaultCategories,
            notifications: { ...defaultNotifications, ...imported.notifications },
            theme: imported.theme || "system",
          })
          
          return true
        } catch {
          return false
        }
      },

      clearAllData: () => {
        set({
          workSchedule: defaultWorkSchedule,
          aiPreferences: defaultAIPreferences,
          categories: defaultCategories,
          notifications: defaultNotifications,
          theme: "system",
        })
      },
    }),
    {
      name: "taskwise-settings",
      partialize: (state) => ({
        workSchedule: state.workSchedule,
        aiPreferences: state.aiPreferences,
        categories: state.categories,
        notifications: state.notifications,
        theme: state.theme,
      }),
    }
  )
)