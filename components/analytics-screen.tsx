"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, Target, Clock, Zap, Brain, CheckCircle2, AlertCircle, X } from "lucide-react"
import { useTaskStore } from "@/lib/task-store"
import { useAnalyticsStore } from "@/lib/analytics-store"

export function AnalyticsScreen() {
  const { tasks } = useTaskStore()
  const {
    weeklyProgress,
    categoryDistribution,
    energyPerformance,
    performanceMetrics,
    aiInsights,
    goals,
    updateAnalytics,
    forceRefresh,
    markInsightAsRead,
    isDataStale
  } = useAnalyticsStore()

  // Update analytics when tasks change or data is stale
  useEffect(() => {
    updateAnalytics(tasks)
  }, [tasks, updateAnalytics])

  const handleRefreshData = () => {
    forceRefresh(tasks)
  }

  const handleDismissInsight = (insightDate: string) => {
    markInsightAsRead(insightDate)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'peak': return TrendingUp
      case 'pattern': return Clock
      case 'suggestion': return Brain
      case 'warning': return AlertCircle
      default: return Brain
    }
  }

  return (
    <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Track your productivity and discover patterns</p>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                {performanceMetrics.completionRate > 80 ? "Great" : "Good"}
              </Badge>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-primary">{performanceMetrics.completionRate}%</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Completion Rate</p>
            <div className="flex items-center mt-1 sm:mt-2 text-xs">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500">+{performanceMetrics.productivityTrend}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              <Badge variant="secondary" className="bg-secondary/20 text-secondary text-xs">
                {performanceMetrics.timeAccuracy > 75 ? "Good" : "Needs Work"}
              </Badge>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-secondary">{performanceMetrics.timeAccuracy}%</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Time Accuracy</p>
            <div className="flex items-center mt-1 sm:mt-2 text-xs">
              <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
              <span className="text-red-500">-2.1%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">
                On Track
              </Badge>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-accent">{performanceMetrics.weeklyGoal}%</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Weekly Goal</p>
            <Progress value={performanceMetrics.weeklyGoal} className="mt-1 sm:mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <Badge variant="secondary" className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200 text-xs">
                Streak
              </Badge>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-green-600">{performanceMetrics.currentStreak}</div>
            <p className="text-xs sm:text-sm text-green-600/80">Days Streak</p>
            <div className="flex items-center mt-1 sm:mt-2 text-xs">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500">Personal Best!</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                />
                <Bar dataKey="completed" fill="#6366f1" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="planned" fill="#e2e8f0" name="Planned" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Task Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 sm:gap-2 mt-4">
              {categoryDistribution.map((category) => (
                <div key={category.name} className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="text-xs sm:text-sm">{category.name}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground ml-auto">{category.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy vs Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Energy vs Performance Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={energyPerformance}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
              />
              <Line
                type="monotone"
                dataKey="energy"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
                name="Energy Level"
              />
              <Line
                type="monotone"
                dataKey="performance"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", strokeWidth: 2, r: 3 }}
                name="Performance"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                AI Insights
              </div>
              {isDataStale() && (
                <Button variant="outline" size="sm" onClick={handleRefreshData} className="text-xs">
                  Refresh
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {aiInsights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type)
              return (
                <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/30 relative group">
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 ${insight.color}`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-xs sm:text-sm">{insight.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-auto p-1"
                    onClick={() => handleDismissInsight(insight.date)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )
            })}
            {aiInsights.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No insights available yet</p>
                <p className="text-xs">Complete more tasks to see AI insights</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goal Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {goals.map((goal, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-xs sm:text-sm">{goal.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {goal.current}/{goal.target}
                  </Badge>
                </div>
                <Progress value={goal.progress} className="h-1.5 sm:h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{goal.progress}% complete</span>
                  <span
                    className={
                      goal.progress >= 80 ? "text-green-500" : goal.progress >= 50 ? "text-yellow-500" : "text-red-500"
                    }
                  >
                    {goal.progress >= 80 ? "On track" : goal.progress >= 50 ? "Behind" : "At risk"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
