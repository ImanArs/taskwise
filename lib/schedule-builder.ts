"use client"

import { Task } from "./task-store"
import { WorkSchedule } from "./settings-store"

export interface WeeklyScheduleData {
  day: string
  date: string
  tasks: number
  hours: number
  scheduledTasks: Task[]
  completionRate: number
}

export interface DailyTimeSlot {
  time: string
  duration: number
  task?: Task
  type: "work" | "break" | "lunch" | "free"
  available: boolean
}

export interface ScheduleOptimizationResult {
  scheduledTasks: Task[]
  suggestions: string[]
  efficiency: number
  workload: "light" | "moderate" | "heavy" | "overloaded"
  freeSlots: DailyTimeSlot[]
}

export class ScheduleBuilder {
  private tasks: Task[]
  private workSchedule: WorkSchedule

  constructor(tasks: Task[], workSchedule: WorkSchedule) {
    this.tasks = tasks
    this.workSchedule = workSchedule
  }

  // Build weekly schedule overview
  buildWeeklySchedule(): WeeklyScheduleData[] {
    const weekDates = this.getWeekDates()
    
    return weekDates.map(date => {
      const dateStr = date.toISOString().split('T')[0]
      const isToday = dateStr === new Date().toISOString().split('T')[0]
      
      // Get tasks for this day
      const dayTasks = this.tasks.filter(task => {
        if (task.scheduledDate === dateStr) return true
        if (isToday && task.scheduled && !task.scheduledDate) return true
        return false
      })

      const scheduledTasks = dayTasks.filter(task => task.scheduled)
      const completedTasks = scheduledTasks.filter(task => task.completed)
      
      // Calculate total hours
      const totalMinutes = scheduledTasks.reduce((sum, task) => sum + task.duration, 0)
      const hours = Math.round((totalMinutes / 60) * 10) / 10

      return {
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        tasks: scheduledTasks.length,
        hours,
        scheduledTasks,
        completionRate: scheduledTasks.length > 0 ? 
          Math.round((completedTasks.length / scheduledTasks.length) * 100) : 0
      }
    })
  }

  // Generate daily time slots
  generateDailyTimeSlots(date: string = new Date().toISOString().split('T')[0]): DailyTimeSlot[] {
    const slots: DailyTimeSlot[] = []
    const dayTasks = this.tasks.filter(task => 
      task.scheduledDate === date && task.scheduled
    ).sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''))

    const startHour = parseInt(this.workSchedule.startTime.split(':')[0])
    const endHour = parseInt(this.workSchedule.endTime.split(':')[0])
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) { // 30-minute slots
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const endTime = this.addMinutes(time, 30)
        
        // Check if this slot has a scheduled task
        const task = dayTasks.find(t => 
          t.scheduledTime && this.isTimeInRange(time, t.scheduledTime, this.addMinutes(t.scheduledTime, t.duration))
        )

        // Check if this is lunch time
        const isLunchTime = this.workSchedule.lunchBreak && 
          this.isTimeInRange(time, this.workSchedule.lunchStart, 
            this.addMinutes(this.workSchedule.lunchStart, this.workSchedule.lunchDuration))

        let slotType: DailyTimeSlot['type'] = 'free'
        if (task) slotType = 'work'
        else if (isLunchTime) slotType = 'lunch'

        slots.push({
          time,
          duration: 30,
          task,
          type: slotType,
          available: !task && !isLunchTime
        })
      }
    }

    return slots
  }

  // Find available time slots
  findAvailableSlots(duration: number, date?: string): DailyTimeSlot[] {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const allSlots = this.generateDailyTimeSlots(targetDate)
    const availableSlots: DailyTimeSlot[] = []

    for (let i = 0; i < allSlots.length; i++) {
      const slotsNeeded = Math.ceil(duration / 30)
      let canFit = true
      
      // Check if we have enough consecutive available slots
      for (let j = 0; j < slotsNeeded && i + j < allSlots.length; j++) {
        if (!allSlots[i + j].available) {
          canFit = false
          break
        }
      }

      if (canFit) {
        availableSlots.push({
          ...allSlots[i],
          duration: duration
        })
        i += slotsNeeded - 1 // Skip the slots we just allocated
      }
    }

    return availableSlots
  }

  // Analyze schedule workload
  analyzeWorkload(date?: string): ScheduleOptimizationResult['workload'] {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const dayTasks = this.tasks.filter(task => 
      task.scheduledDate === targetDate && task.scheduled
    )

    const totalMinutes = dayTasks.reduce((sum, task) => sum + task.duration, 0)
    const workDayMinutes = this.getWorkDayMinutes()
    const utilizationRate = totalMinutes / workDayMinutes

    if (utilizationRate >= 1.0) return 'overloaded'
    if (utilizationRate >= 0.8) return 'heavy'
    if (utilizationRate >= 0.5) return 'moderate'
    return 'light'
  }

  // Generate schedule suggestions
  generateScheduleSuggestions(date?: string): string[] {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const suggestions: string[] = []
    const workload = this.analyzeWorkload(targetDate)
    const unscheduledTasks = this.tasks.filter(task => !task.scheduled)
    const availableSlots = this.findAvailableSlots(60, targetDate) // Find 1-hour slots

    // Workload-based suggestions
    switch (workload) {
      case 'overloaded':
        suggestions.push('Consider rescheduling some tasks to reduce workload')
        suggestions.push('Take regular breaks to maintain productivity')
        break
      case 'heavy':
        suggestions.push('High workload day - prioritize most important tasks')
        suggestions.push('Consider shorter breaks between tasks')
        break
      case 'light':
        if (unscheduledTasks.length > 0) {
          suggestions.push(`${availableSlots.length} available slots for new tasks`)
          suggestions.push('Good opportunity to tackle pending tasks')
        }
        break
      case 'moderate':
        suggestions.push('Well-balanced schedule')
        if (availableSlots.length > 2) {
          suggestions.push('Room for additional tasks if needed')
        }
        break
    }

    // Task-specific suggestions
    if (unscheduledTasks.length > 0) {
      const highPriorityUnscheduled = unscheduledTasks.filter(task => task.priority === 'High')
      if (highPriorityUnscheduled.length > 0) {
        suggestions.push(`${highPriorityUnscheduled.length} high-priority tasks need scheduling`)
      }
    }

    // Time-based suggestions
    const currentHour = new Date().getHours()
    if (currentHour >= 9 && currentHour <= 11) {
      suggestions.push('Peak energy time - good for challenging tasks')
    } else if (currentHour >= 14 && currentHour <= 16) {
      suggestions.push('Afternoon focus time - ideal for deep work')
    }

    return suggestions.slice(0, 3) // Return top 3 suggestions
  }

  // Helper methods
  private getWeekDates(): Date[] {
    const dates: Date[] = []
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - currentDay + 1)

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  private getWorkDayMinutes(): number {
    const start = this.timeToMinutes(this.workSchedule.startTime)
    const end = this.timeToMinutes(this.workSchedule.endTime)
    let total = end - start

    if (this.workSchedule.lunchBreak) {
      total -= this.workSchedule.lunchDuration
    }

    return total
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  private addMinutes(time: string, minutesToAdd: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutesToAdd
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  private isTimeInRange(checkTime: string, startTime: string, endTime: string): boolean {
    const check = this.timeToMinutes(checkTime)
    const start = this.timeToMinutes(startTime)
    const end = this.timeToMinutes(endTime)
    return check >= start && check < end
  }

  // Calculate schedule efficiency
  calculateScheduleEfficiency(date?: string): number {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const dayTasks = this.tasks.filter(task => 
      task.scheduledDate === targetDate && task.scheduled
    )

    if (dayTasks.length === 0) return 0

    const completedTasks = dayTasks.filter(task => task.completed)
    const completionRate = completedTasks.length / dayTasks.length

    // Factor in energy level matching
    const energyMatches = dayTasks.filter(task => {
      if (!task.scheduledTime) return false
      const hour = parseInt(task.scheduledTime.split(':')[0])
      
      // Morning people peak 8-11 AM
      if (task.energyLevel === 'High' && hour >= 8 && hour <= 11) return true
      // Afternoon peak 14-16
      if (task.energyLevel === 'High' && hour >= 14 && hour <= 16) return true
      // Low energy tasks in off-peak hours
      if (task.energyLevel === 'Low' && (hour < 8 || hour > 17)) return true
      
      return false
    }).length

    const energyEfficiency = energyMatches / dayTasks.length
    
    // Combine completion rate and energy efficiency
    return Math.round((completionRate * 0.6 + energyEfficiency * 0.4) * 100)
  }
}