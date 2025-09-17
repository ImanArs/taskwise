"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ScheduleBuilder, WeeklyScheduleData, DailyTimeSlot } from "./schedule-builder"
import { Task } from "./task-store"
import { WorkSchedule } from "./settings-store"

export interface OptimizationHistory {
  id: string
  type: "productivity" | "balance" | "frontload"
  date: string
  tasksOptimized: number
  efficiency: number
  userRating?: number
}

export interface ScheduleSuggestion {
  id: string
  type: "time_slot" | "task_reorder" | "break_reminder" | "workload_warning"
  title: string
  description: string
  priority: number
  date: string
  dismissed: boolean
}

interface PlanningStore {
  // Weekly schedule data
  weeklySchedule: WeeklyScheduleData[]
  dailyTimeSlots: DailyTimeSlot[]
  currentDate: string
  
  // Optimization history
  optimizationHistory: OptimizationHistory[]
  lastOptimization: OptimizationHistory | null
  isOptimizing: boolean

  // Schedule suggestions
  suggestions: ScheduleSuggestion[]
  
  // View preferences
  viewMode: "week" | "day"
  
  // Actions
  updateSchedule: (tasks: Task[], workSchedule: WorkSchedule) => void
  setCurrentDate: (date: string) => void
  setViewMode: (mode: "week" | "day") => void
  
  // Optimization actions
  startOptimization: (type: OptimizationHistory['type']) => void
  finishOptimization: (tasksOptimized: number, efficiency: number) => void
  rateOptimization: (id: string, rating: number) => void
  
  // Suggestion actions
  addSuggestion: (suggestion: Omit<ScheduleSuggestion, "id">) => void
  dismissSuggestion: (id: string) => void
  clearOldSuggestions: () => void
  
  // Getters
  getCurrentDaySchedule: () => WeeklyScheduleData | undefined
  getAvailableTimeSlots: (duration: number) => DailyTimeSlot[]
  getOptimizationStats: () => { totalOptimizations: number, averageEfficiency: number, averageRating: number }
}

export const usePlanningStore = create<PlanningStore>()(
  persist(
    (set, get) => ({
      // Initial state
      weeklySchedule: [],
      dailyTimeSlots: [],
      currentDate: new Date().toISOString().split('T')[0],
      optimizationHistory: [],
      lastOptimization: null,
      isOptimizing: false,
      suggestions: [],
      viewMode: "week",

      // Update schedule data
      updateSchedule: (tasks: Task[], workSchedule: WorkSchedule) => {
        const state = get()
        const builder = new ScheduleBuilder(tasks, workSchedule)
        
        const weeklySchedule = builder.buildWeeklySchedule()
        const dailyTimeSlots = builder.generateDailyTimeSlots(state.currentDate)
        
        // Generate automatic suggestions
        const newSuggestions: Omit<ScheduleSuggestion, "id">[] = []
        
        // Check for workload warnings
        const todaySchedule = weeklySchedule.find(day => 
          day.date === new Date(state.currentDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })
        )
        
        if (todaySchedule && todaySchedule.hours > 8) {
          newSuggestions.push({
            type: "workload_warning",
            title: "Heavy Workload",
            description: `${todaySchedule.hours} hours scheduled today. Consider rescheduling some tasks.`,
            priority: 1,
            date: new Date().toISOString(),
            dismissed: false
          })
        }

        // Check for available time slots
        const availableSlots = builder.findAvailableSlots(60, state.currentDate)
        if (availableSlots.length > 3) {
          newSuggestions.push({
            type: "time_slot",
            title: "Available Time Slots",
            description: `${availableSlots.length} free hours available for new tasks.`,
            priority: 2,
            date: new Date().toISOString(),
            dismissed: false
          })
        }

        // Check for break reminders
        const workingSessions = dailyTimeSlots.filter(slot => slot.type === 'work')
        const consecutiveWork = workingSessions.length
        if (consecutiveWork > 4) { // More than 2 hours consecutive work
          newSuggestions.push({
            type: "break_reminder",
            title: "Break Reminder",
            description: "Consider scheduling breaks between long work sessions.",
            priority: 2,
            date: new Date().toISOString(),
            dismissed: false
          })
        }

        set({
          weeklySchedule,
          dailyTimeSlots,
          suggestions: [
            ...state.suggestions.filter(s => !s.dismissed && 
              new Date(s.date).getTime() > Date.now() - 24 * 60 * 60 * 1000
            ),
            ...newSuggestions
          ]
        })
      },

      setCurrentDate: (date: string) => {
        set({ currentDate: date })
      },

      setViewMode: (mode: "week" | "day") => {
        set({ viewMode: mode })
      },

      // Optimization management
      startOptimization: (type: OptimizationHistory['type']) => {
        set({ 
          isOptimizing: true,
          lastOptimization: null 
        })
      },

      finishOptimization: (tasksOptimized: number, efficiency: number) => {
        const optimization: OptimizationHistory = {
          id: Date.now().toString(),
          type: get().isOptimizing ? "productivity" : "productivity", // Default fallback
          date: new Date().toISOString(),
          tasksOptimized,
          efficiency
        }

        set((state) => ({
          isOptimizing: false,
          lastOptimization: optimization,
          optimizationHistory: [...state.optimizationHistory, optimization]
        }))
      },

      rateOptimization: (id: string, rating: number) => {
        set((state) => ({
          optimizationHistory: state.optimizationHistory.map(opt =>
            opt.id === id ? { ...opt, userRating: rating } : opt
          ),
          lastOptimization: state.lastOptimization?.id === id ? 
            { ...state.lastOptimization, userRating: rating } : state.lastOptimization
        }))
      },

      // Suggestion management
      addSuggestion: (suggestionData) => {
        const suggestion: ScheduleSuggestion = {
          ...suggestionData,
          id: Date.now().toString()
        }
        
        set((state) => ({
          suggestions: [...state.suggestions, suggestion]
        }))
      },

      dismissSuggestion: (id: string) => {
        set((state) => ({
          suggestions: state.suggestions.map(s => 
            s.id === id ? { ...s, dismissed: true } : s
          )
        }))
      },

      clearOldSuggestions: () => {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        set((state) => ({
          suggestions: state.suggestions.filter(s => 
            new Date(s.date).getTime() > oneDayAgo && !s.dismissed
          )
        }))
      },

      // Getters
      getCurrentDaySchedule: () => {
        const state = get()
        const today = new Date(state.currentDate)
        const todayStr = today.toLocaleDateString('en', { month: 'short', day: 'numeric' })
        
        return state.weeklySchedule.find(day => day.date === todayStr)
      },

      getAvailableTimeSlots: (duration: number) => {
        const state = get()
        return state.dailyTimeSlots.filter(slot => 
          slot.available && slot.duration >= duration
        )
      },

      getOptimizationStats: () => {
        const state = get()
        const history = state.optimizationHistory
        
        if (history.length === 0) {
          return { totalOptimizations: 0, averageEfficiency: 0, averageRating: 0 }
        }

        const totalOptimizations = history.length
        const averageEfficiency = Math.round(
          history.reduce((sum, opt) => sum + opt.efficiency, 0) / totalOptimizations
        )
        
        const ratedOptimizations = history.filter(opt => opt.userRating !== undefined)
        const averageRating = ratedOptimizations.length > 0 ? 
          Math.round(
            ratedOptimizations.reduce((sum, opt) => sum + (opt.userRating || 0), 0) / ratedOptimizations.length * 10
          ) / 10 : 0

        return { totalOptimizations, averageEfficiency, averageRating }
      }
    }),
    {
      name: "taskwise-planning",
      partialize: (state) => ({
        currentDate: state.currentDate,
        optimizationHistory: state.optimizationHistory,
        lastOptimization: state.lastOptimization,
        suggestions: state.suggestions,
        viewMode: state.viewMode,
      }),
    }
  )
)