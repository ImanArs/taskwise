"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Task {
  id: string
  title: string
  description?: string
  category: "Work" | "Personal" | "Health" | "Learning"
  priority: "High" | "Medium" | "Low"
  duration: number
  deadline?: string
  energyLevel: "High" | "Medium" | "Low"
  scheduled?: boolean
  scheduledTime?: string
  scheduledDate?: string
  completed: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
}

interface TaskStore {
  tasks: Task[]
  addTask: (task: Omit<Task, "id" | "completed" | "createdAt" | "updatedAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
  uncompleteTask: (id: string) => void
  getTodayTasks: () => Task[]
  getUnscheduledTasks: () => Task[]
  getTasksByCategory: (category: Task["category"]) => Task[]
  getTasksByPriority: (priority: Task["priority"]) => Task[]
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: Date.now().toString(),
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }))
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task,
          ),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }))
      },

      completeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completed: true,
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : task,
          ),
        }))
      },

      uncompleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completed: false,
                  completedAt: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : task,
          ),
        }))
      },

      getTodayTasks: () => {
        const today = new Date().toISOString().split("T")[0]
        return get().tasks.filter((task) => task.scheduledDate === today || (!task.scheduledDate && task.scheduled))
      },

      getUnscheduledTasks: () => {
        return get().tasks.filter((task) => !task.scheduled)
      },

      getTasksByCategory: (category) => {
        return get().tasks.filter((task) => task.category === category)
      },

      getTasksByPriority: (priority) => {
        return get().tasks.filter((task) => task.priority === priority)
      },
    }),
    {
      name: "taskwise-tasks",
    },
  ),
)
