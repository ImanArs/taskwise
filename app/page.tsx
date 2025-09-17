"use client"

import { useState } from "react"
import { TodayScreen } from "@/components/today-screen"
import { PlanningScreen } from "@/components/planning-screen"
import { AnalyticsScreen } from "@/components/analytics-screen"
import { SettingsScreen } from "@/components/settings-screen"
import { Calendar, BarChart3, Settings, CheckCircle2 } from "lucide-react"

type TabType = "today" | "planning" | "analytics" | "settings"

export default function TaskWiseApp() {
  const [activeTab, setActiveTab] = useState<TabType>("today")

  const tabs = [
    { id: "today" as TabType, label: "Today", icon: CheckCircle2 },
    { id: "planning" as TabType, label: "Planning", icon: Calendar },
    { id: "analytics" as TabType, label: "Analytics", icon: BarChart3 },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
  ]

  const renderScreen = () => {
    switch (activeTab) {
      case "today":
        return <TodayScreen />
      case "planning":
        return <PlanningScreen />
      case "analytics":
        return <AnalyticsScreen />
      case "settings":
        return <SettingsScreen />
      default:
        return <TodayScreen />
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Animated floating orbs background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-28 h-28 bg-blue-400/80 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob" />
        <div className="absolute w-28 h-28 bg-purple-400/80 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-8000 top-0 right-0" />
        <div className="absolute w-28 h-28 bg-green-400/80 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000 bottom-0 left-0" />
        <div className="absolute w-36 h-36 bg-cyan-400/80 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-8000 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute w-40 h-40 bg-indigo-400/80 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-10000 top-1/4 left-1/4" />
        <div className="absolute w-32 h-32 bg-violet-400/80 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-12000 top-3/4 right-1/4" />
      </div>

      {/* Blur overlay */}
      <div className="fixed inset-0 pointer-events-none z-10" />

      <div className="relative z-20 flex flex-col h-screen">
        {/* Main content */}
        <main className="flex-1 overflow-auto">{renderScreen()}</main>

        {/* Bottom navigation */}
        <nav className="bg-card/80 backdrop-blur-[4px] border-t border-border">
          <div className="flex items-center justify-around px-2 sm:px-4 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 min-w-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium truncate max-w-[50px] sm:max-w-none">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
