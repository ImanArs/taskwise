"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { 
  AnalyticsCalculator, 
  WeeklyProgressData, 
  CategoryDistribution, 
  EnergyPerformanceData, 
  PerformanceMetrics, 
  AIInsight, 
  Goal 
} from "./analytics-calculator"
import { Task } from "./task-store"

interface AnalyticsStore {
  // Cached analytics data
  weeklyProgress: WeeklyProgressData[]
  categoryDistribution: CategoryDistribution[]
  energyPerformance: EnergyPerformanceData[]
  performanceMetrics: PerformanceMetrics
  aiInsights: AIInsight[]
  goals: Goal[]
  
  // Cache management
  lastCalculated: string
  cacheValidityHours: number

  // Actions
  updateAnalytics: (tasks: Task[]) => void
  forceRefresh: (tasks: Task[]) => void
  addCustomGoal: (goal: Omit<Goal, "id">) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  markInsightAsRead: (date: string) => void
  
  // Getters
  isDataStale: () => boolean
  getInsightsByType: (type: AIInsight["type"]) => AIInsight[]
  getGoalsByType: (type: Goal["type"]) => Goal[]
}

const defaultMetrics: PerformanceMetrics = {
  completionRate: 0,
  timeAccuracy: 0,
  productivityTrend: 0,
  weeklyGoal: 85,
  currentStreak: 0,
  totalTasksCompleted: 0,
  averageTaskDuration: 0
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      weeklyProgress: [],
      categoryDistribution: [],
      energyPerformance: [],
      performanceMetrics: defaultMetrics,
      aiInsights: [],
      goals: [],
      lastCalculated: "",
      cacheValidityHours: 1, // Cache for 1 hour

      // Update analytics with fresh task data
      updateAnalytics: (tasks: Task[]) => {
        const calculator = new AnalyticsCalculator(tasks)
        const now = new Date().toISOString()

        set({
          weeklyProgress: calculator.calculateWeeklyProgress(),
          categoryDistribution: calculator.calculateCategoryDistribution(),
          energyPerformance: calculator.calculateEnergyPerformance(),
          performanceMetrics: calculator.calculatePerformanceMetrics(),
          aiInsights: calculator.generateAIInsights(),
          goals: calculator.generateDefaultGoals(),
          lastCalculated: now
        })
      },

      // Force refresh regardless of cache
      forceRefresh: (tasks: Task[]) => {
        const calculator = new AnalyticsCalculator(tasks)
        const now = new Date().toISOString()

        set({
          weeklyProgress: calculator.calculateWeeklyProgress(),
          categoryDistribution: calculator.calculateCategoryDistribution(),
          energyPerformance: calculator.calculateEnergyPerformance(),
          performanceMetrics: calculator.calculatePerformanceMetrics(),
          aiInsights: calculator.generateAIInsights(),
          goals: calculator.generateDefaultGoals(),
          lastCalculated: now
        })
      },

      // Goal management
      addCustomGoal: (goalData) => {
        const newGoal: Goal = {
          ...goalData,
          id: `custom-${Date.now()}`,
        }
        set((state) => ({
          goals: [...state.goals, newGoal]
        }))
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map(goal => 
            goal.id === id ? { ...goal, ...updates } : goal
          )
        }))
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter(goal => goal.id !== id)
        }))
      },

      // Mark insight as read (remove it)
      markInsightAsRead: (date) => {
        set((state) => ({
          aiInsights: state.aiInsights.filter(insight => insight.date !== date)
        }))
      },

      // Cache validation
      isDataStale: () => {
        const state = get()
        if (!state.lastCalculated) return true
        
        const lastCalc = new Date(state.lastCalculated)
        const now = new Date()
        const hoursDiff = (now.getTime() - lastCalc.getTime()) / (1000 * 60 * 60)
        
        return hoursDiff >= state.cacheValidityHours
      },

      // Filtered getters
      getInsightsByType: (type) => {
        const state = get()
        return state.aiInsights.filter(insight => insight.type === type)
      },

      getGoalsByType: (type) => {
        const state = get()
        return state.goals.filter(goal => goal.type === type)
      },
    }),
    {
      name: "taskwise-analytics",
      partialize: (state) => ({
        weeklyProgress: state.weeklyProgress,
        categoryDistribution: state.categoryDistribution,
        energyPerformance: state.energyPerformance,
        performanceMetrics: state.performanceMetrics,
        aiInsights: state.aiInsights,
        goals: state.goals,
        lastCalculated: state.lastCalculated,
        cacheValidityHours: state.cacheValidityHours,
      }),
    }
  )
)