"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Calendar, Activity, Bell, Settings, LogOut, Wind, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface UserData {
  email: string
  name: string
  role: string
  joinDate: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/login")
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const recentActivity = [
    { action: "Viewed AQI Map", location: "Delhi", time: "2 hours ago", aqi: 156 },
    { action: "Checked Forecast", location: "Mumbai", time: "1 day ago", aqi: 89 },
    { action: "Set Alert", location: "Bangalore", time: "3 days ago", aqi: 45 },
  ]

  const watchedLocations = [
    { name: "Delhi", aqi: 156, status: "Unhealthy", trend: "up" },
    { name: "Mumbai", aqi: 89, status: "Moderate", trend: "down" },
    { name: "Bangalore", aqi: 45, status: "Good", trend: "stable" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-20 pb-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            ← Back to Home
          </Link>

          <Card className="bg-card/80 backdrop-blur-lg border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16 bg-primary">
                    <AvatarFallback className="text-white text-xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl text-foreground">{user.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{user.email}</CardDescription>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-1" />
                        Joined {new Date(user.joinDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="text-destructive hover:text-destructive bg-transparent"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card/80 backdrop-blur-lg border border-border">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Watched Locations</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/80 backdrop-blur-lg border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Locations Watched</p>
                      <p className="text-2xl font-bold text-foreground">3</p>
                    </div>
                    <Eye className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-lg border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Alerts Set</p>
                      <p className="text-2xl font-bold text-foreground">5</p>
                    </div>
                    <Bell className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-lg border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg AQI Today</p>
                      <p className="text-2xl font-bold text-foreground">97</p>
                    </div>
                    <Wind className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-lg border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Health Score</p>
                      <p className="text-2xl font-bold text-foreground">Good</p>
                    </div>
                    <Activity className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/80 backdrop-blur-lg border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Activity</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your recent interactions with the AirQuality.AI system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.location} • {activity.time}
                          </p>
                        </div>
                      </div>
                      <Badge variant={activity.aqi > 100 ? "destructive" : activity.aqi > 50 ? "secondary" : "default"}>
                        AQI {activity.aqi}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-lg border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Watched Locations</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Monitor air quality in your favorite locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {watchedLocations.map((location, index) => (
                    <Card key={index} className="bg-secondary/20 border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{location.name}</h3>
                          <Badge
                            variant={location.aqi > 100 ? "destructive" : location.aqi > 50 ? "secondary" : "default"}
                          >
                            {location.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-foreground">{location.aqi}</span>
                          <div className="text-xs text-muted-foreground">
                            {location.trend === "up" ? "↗️" : location.trend === "down" ? "↘️" : "→"} Trending{" "}
                            {location.trend}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-lg border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Notification Settings</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage how you receive air quality alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Email Alerts</p>
                    <p className="text-sm text-muted-foreground">Receive daily air quality reports</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified when AQI exceeds threshold</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Weekly Summary</p>
                    <p className="text-sm text-muted-foreground">Weekly air quality trends report</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
