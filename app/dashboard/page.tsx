"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Building2,
  Microscope,
  Shield,
  MapPin,
  TrendingUp,
  Download,
  AlertTriangle,
  Heart,
  BarChart3,
  Activity,
  Globe,
  Database,
  Settings,
  RefreshCw,
  Search,
} from "lucide-react"

// Types for our data
interface AQIData {
  aqi: number
  location: string
  city: string
  state: string
  country: string
  lastUpdated: string
  components: {
    pm2_5: number
    pm10: number
    no2: number
    so2: number
    co: number
    o3: number
  }
}

interface ForecastData {
  day: string
  aqi: number
  date: string
}

interface HealthRecommendation {
  level: string
  message: string
  description: string
  color: string
  bgColor: string
  borderColor: string
}

interface City {
  name: string
  state: string
  country: string
  lat: number
  lon: number
}

export default function DashboardPage() {
  const [selectedRole, setSelectedRole] = useState("citizen")
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; city?: string; state?: string; country?: string } | null>(null)
  const [aqiData, setAqiData] = useState<AQIData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showCitySearch, setShowCitySearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<City[]>([])
  const [searching, setSearching] = useState(false)

  // API Keys
  const WAQI_API_KEY = process.env.NEXT_PUBLIC_WAQI_API_KEY || "03e28d4aa2a86be9539e6f11a52dc4d752960f75"
  const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "e33354f16254687a15b0f926b90ba40d"

  // Major Indian cities for manual selection
  const majorIndianCities: City[] = [
    { name: "Jabalpur", state: "Madhya Pradesh", country: "India", lat: 23.1815, lon: 79.9864 },
    { name: "Mumbai", state: "Maharashtra", country: "India", lat: 19.0760, lon: 72.8777 },
    { name: "Delhi", state: "Delhi", country: "India", lat: 28.6139, lon: 77.2090 },
    { name: "Bangalore", state: "Karnataka", country: "India", lat: 12.9716, lon: 77.5946 },
    { name: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0827, lon: 80.2707 },
    { name: "Kolkata", state: "West Bengal", country: "India", lat: 22.5726, lon: 88.3639 },
    { name: "Hyderabad", state: "Telangana", country: "India", lat: 17.3850, lon: 78.4867 },
    { name: "Pune", state: "Maharashtra", country: "India", lat: 18.5204, lon: 73.8567 },
    { name: "Ahmedabad", state: "Gujarat", country: "India", lat: 23.0225, lon: 72.5714 },
    { name: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9124, lon: 75.7873 },
    { name: "Lucknow", state: "Uttar Pradesh", country: "India", lat: 26.8467, lon: 80.9462 },
    { name: "Bhopal", state: "Madhya Pradesh", country: "India", lat: 23.2599, lon: 77.4126 },
    { name: "Indore", state: "Madhya Pradesh", country: "India", lat: 22.7196, lon: 75.8577 },
    { name: "Pithampur", state: "Madhya Pradesh", country: "India", lat: 22.6193, lon: 75.6935 },
  ]

  useEffect(() => {
    detectUserLocation()
  }, [])

  const detectUserLocation = async () => {
    try {
      setLoading(true)
      setError(null)

      // Method 1: Try high-accuracy browser geolocation first
      const accurateLocation = await getAccurateBrowserLocation()
      if (accurateLocation) {
        setUserLocation(accurateLocation)
        await fetchAllData(accurateLocation.lat, accurateLocation.lon)
        return
      }

      // Method 2: Try multiple IP geolocation services
      const ipLocation = await getAccurateIPLocation()
      if (ipLocation) {
        setUserLocation(ipLocation)
        setError(`Using network location: ${ipLocation.city}. You can manually select your city if this is wrong.`)
        await fetchAllData(ipLocation.lat, ipLocation.lon)
        return
      }

      // Method 3: Default to Jabalpur since that's where you are
      setError("Using default location: Jabalpur. Please select your exact location manually.")
      const defaultLocation = { lat: 23.1815, lon: 79.9864, city: "Jabalpur", state: "Madhya Pradesh", country: "India" }
      setUserLocation(defaultLocation)
      await fetchAllData(defaultLocation.lat, defaultLocation.lon)

    } catch (err) {
      console.error("All location methods failed:", err)
      setError("Using default location: Jabalpur. Please select your city manually.")
      const defaultLocation = { lat: 23.1815, lon: 79.9864, city: "Jabalpur", state: "Madhya Pradesh", country: "India" }
      setUserLocation(defaultLocation)
      await fetchAllData(defaultLocation.lat, defaultLocation.lon)
    } finally {
      setLoading(false)
    }
  }

  const getAccurateBrowserLocation = (): Promise<{ lat: number; lon: number; city?: string; state?: string; country?: string } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          console.log("Browser GPS coordinates:", latitude, longitude)
          
          // Get accurate city name using multiple geocoding services
          try {
            const locationInfo = await getAccurateCityName(latitude, longitude)
            resolve({
              lat: latitude,
              lon: longitude,
              city: locationInfo.city,
              state: locationInfo.state,
              country: locationInfo.country
            })
          } catch {
            resolve({ lat: latitude, lon: longitude })
          }
        },
        (error) => {
          console.log("High accuracy location failed:", error)
          resolve(null)
        },
        {
          enableHighAccuracy: true, // Use GPS
          timeout: 15000,
          maximumAge: 0 // Don't use cached position
        }
      )
    })
  }

  const getAccurateIPLocation = async (): Promise<{ lat: number; lon: number; city: string; state: string; country: string } | null> => {
    try {
      // Try multiple IP geolocation services
      const services = [
        'https://api.ipgeolocation.io/ipgeo?apiKey=YOUR_KEY', // You can sign up for free tier
        'https://ipapi.co/json/',
        'https://extreme-ip-lookup.com/json/'
      ]

      for (const service of services) {
        try {
          const response = await fetch(service)
          if (response.ok) {
            const data = await response.json()
            if (data.latitude && data.longitude) {
              return {
                lat: data.latitude,
                lon: data.longitude,
                city: data.city,
                state: data.region || data.regionName,
                country: data.country_name || data.country
              }
            }
          }
        } catch (e) {
          console.log(`IP service ${service} failed:`, e)
        }
      }
      return null
    } catch (error) {
      console.log("All IP location services failed:", error)
      return null
    }
  }

  const getAccurateCityName = async (lat: number, lon: number): Promise<{ city: string; state: string; country: string }> => {
    try {
      // Try OpenWeatherMap geocoding
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5&appid=${OPENWEATHER_API_KEY}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          // Find the most specific location (city/town)
          const location = data[0]
          return {
            city: location.name,
            state: location.state || location.country,
            country: location.country
          }
        }
      }
      throw new Error("No location data")
    } catch (error) {
      console.log("Reverse geocoding failed:", error)
      return { city: "Unknown", state: "Unknown", country: "Unknown" }
    }
  }

  const searchCities = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      // First search in our predefined cities
      const filteredCities = majorIndianCities.filter(city =>
        city.name.toLowerCase().includes(query.toLowerCase()) ||
        city.state.toLowerCase().includes(query.toLowerCase())
      )

      // Also try to search using OpenWeatherMap geocoding
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${OPENWEATHER_API_KEY}`
      )
      
      if (geoResponse.ok) {
        const geoData = await geoResponse.json()
        const apiCities = geoData.map((item: any) => ({
          name: item.name,
          state: item.state || item.country,
          country: item.country,
          lat: item.lat,
          lon: item.lon
        }))
        
        // Combine and remove duplicates
        const allCities = [...filteredCities, ...apiCities]
        const uniqueCities = allCities.filter((city, index, self) =>
          index === self.findIndex(c => c.name === city.name && c.state === city.state)
        )
        
        setSearchResults(uniqueCities.slice(0, 10))
      } else {
        setSearchResults(filteredCities.slice(0, 10))
      }
    } catch (error) {
      console.log("City search failed:", error)
      setSearchResults(majorIndianCities.filter(city =>
        city.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10))
    } finally {
      setSearching(false)
    }
  }

  const handleCitySelect = (city: City) => {
    setUserLocation({
      lat: city.lat,
      lon: city.lon,
      city: city.name,
      state: city.state,
      country: city.country
    })
    setShowCitySearch(false)
    setSearchQuery("")
    setSearchResults([])
    fetchAllData(city.lat, city.lon)
  }

  const fetchAllData = async (lat: number, lon: number) => {
    await Promise.all([
      fetchAQIData(lat, lon),
      fetchForecastData(lat, lon)
    ])
  }

  const fetchAQIData = async (lat: number, lon: number) => {
    try {
      setRefreshing(true)
      
      // Try WAQI API first
      let aqiData = await fetchWAQIData(lat, lon)
      if (!aqiData) {
        // Fallback to OpenWeatherMap Air Pollution API
        aqiData = await fetchOpenWeatherAQIData(lat, lon)
      }

      if (aqiData) {
        setAqiData(aqiData)
      } else {
        throw new Error("All AQI APIs failed")
      }
      
    } catch (err) {
      console.error("Error fetching AQI data:", err)
      setError("Failed to load live air quality data. Showing sample data.")
      setAqiData(getMockAQIData())
    } finally {
      setRefreshing(false)
    }
  }

  const fetchWAQIData = async (lat: number, lon: number): Promise<AQIData | null> => {
    try {
      const response = await fetch(
        `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_API_KEY}`
      )
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const data = await response.json()
      
      if (data.status !== "ok" || !data.data) {
        throw new Error(data.data || "Invalid WAQI response")
      }
      
      const aqi = data.data.aqi
      const location = data.data.city?.name || `${userLocation?.city}, ${userLocation?.state}` || "Unknown Location"
      const components = data.data.iaqi || {}
      
      return {
        aqi: aqi || 0,
        location: location,
        city: userLocation?.city || location.split(',')[0] || "Unknown",
        state: userLocation?.state || location.split(',')[1]?.trim() || "Unknown",
        country: userLocation?.country || "India",
        lastUpdated: new Date().toLocaleTimeString(),
        components: {
          pm2_5: components.pm25?.v || 0,
          pm10: components.pm10?.v || 0,
          no2: components.no2?.v || 0,
          so2: components.so2?.v || 0,
          co: components.co?.v || 0,
          o3: components.o3?.v || 0
        }
      }
    } catch (error) {
      console.log("WAQI API failed:", error)
      return null
    }
  }

  const fetchOpenWeatherAQIData = async (lat: number, lon: number): Promise<AQIData | null> => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
      )
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const data = await response.json()
      
      if (!data.list || data.list.length === 0) {
        throw new Error("No air pollution data")
      }
      
      const airData = data.list[0]
      const components = airData.components
      const aqi = calculateAQIFromComponents(components)
      
      return {
        aqi: aqi,
        location: `${userLocation?.city || "Unknown"}, ${userLocation?.state || "Unknown"}`,
        city: userLocation?.city || "Unknown",
        state: userLocation?.state || "Unknown",
        country: userLocation?.country || "India",
        lastUpdated: new Date().toLocaleTimeString(),
        components: {
          pm2_5: components.pm2_5 || 0,
          pm10: components.pm10 || 0,
          no2: components.no2 || 0,
          so2: components.so2 || 0,
          co: components.co || 0,
          o3: components.o3 || 0
        }
      }
    } catch (error) {
      console.log("OpenWeatherMap API failed:", error)
      return null
    }
  }

  const calculateAQIFromComponents = (components: any): number => {
    const pm25 = components.pm2_5 || 0
    if (pm25 <= 12) return Math.floor(pm25 * 4.17)
    if (pm25 <= 35.4) return Math.floor(50 + (pm25 - 12) * (50/23.4))
    if (pm25 <= 55.4) return Math.floor(100 + (pm25 - 35.4) * (100/20))
    if (pm25 <= 150.4) return Math.floor(200 + (pm25 - 55.4) * (100/95))
    return Math.floor(300 + (pm25 - 150.4) * (100/249.6))
  }

  const getMockAQIData = (): AQIData => {
    return {
      aqi: 67,
      location: `${userLocation?.city || "Jabalpur"}, ${userLocation?.state || "Madhya Pradesh"}`,
      city: userLocation?.city || "Jabalpur",
      state: userLocation?.state || "Madhya Pradesh",
      country: userLocation?.country || "India",
      lastUpdated: new Date().toLocaleTimeString(),
      components: {
        pm2_5: 18.4,
        pm10: 32.2,
        no2: 12.7,
        so2: 3.2,
        co: 0.6,
        o3: 28.1
      }
    }
  }

  const fetchForecastData = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_API_KEY}`
      )
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.status === "ok" && data.data.forecast) {
          const forecast = data.data.forecast.daily || {}
          const pm25Forecast = forecast.pm25 || []
          
          const forecastData: ForecastData[] = pm25Forecast.slice(0, 7).map((day: any, index: number) => {
            const date = new Date(day.day)
            return {
              day: date.toLocaleDateString('en-US', { weekday: 'short' }),
              aqi: Math.round(day.avg || 50 + Math.random() * 100),
              date: date.toISOString()
            }
          })
          
          if (forecastData.length > 0) {
            setForecastData(forecastData)
            return
          }
        }
      }
      
      setForecastData(generateMockForecast())
      
    } catch (err) {
      console.error("Error fetching forecast data:", err)
      setForecastData(generateMockForecast())
    }
  }

  const generateMockForecast = (): ForecastData[] => {
    const baseAqi = aqiData?.aqi || 65
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() + (i * 86400000))
      const variation = (Math.random() - 0.5) * 30
      const aqi = Math.max(0, Math.min(300, Math.round(baseAqi + variation)))
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        aqi: aqi,
        date: date.toISOString()
      }
    })
  }

  const getAQILevel = (aqi: number) => {
    if (aqi <= 50) return { level: "Good", color: "bg-green-500", textColor: "text-green-400" }
    if (aqi <= 100) return { level: "Moderate", color: "bg-yellow-500", textColor: "text-yellow-400" }
    if (aqi <= 150) return { level: "Unhealthy for Sensitive", color: "bg-orange-500", textColor: "text-orange-400" }
    if (aqi <= 200) return { level: "Unhealthy", color: "bg-red-500", textColor: "text-red-400" }
    if (aqi <= 300) return { level: "Very Unhealthy", color: "bg-purple-500", textColor: "text-purple-400" }
    return { level: "Hazardous", color: "bg-red-800", textColor: "text-red-800" }
  }

  const getHealthRecommendations = (aqi: number): HealthRecommendation[] => {
    const recommendations: HealthRecommendation[] = []
    
    if (aqi <= 50) {
      recommendations.push({
        level: "Good",
        message: "Air quality is satisfactory",
        description: "Ideal for outdoor activities",
        color: "green",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20"
      })
    } else if (aqi <= 100) {
      recommendations.push({
        level: "Moderate",
        message: "Acceptable air quality",
        description: "Unusually sensitive people should consider reducing prolonged outdoor exertion",
        color: "yellow",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20"
      })
    } else if (aqi <= 150) {
      recommendations.push({
        level: "Sensitive Groups",
        message: "Sensitive groups should limit exposure",
        description: "People with respiratory or heart disease, the elderly and children should limit prolonged outdoor exertion",
        color: "orange",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20"
      })
    } else {
      recommendations.push({
        level: "Unhealthy",
        message: "Everyone may experience health effects",
        description: "Active children and adults, and people with respiratory disease should avoid prolonged outdoor exertion",
        color: "red",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20"
      })
    }

    recommendations.push({
      level: "General",
      message: "Stay informed about air quality",
      description: "Check daily AQI forecasts and plan activities accordingly",
      color: "blue",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    })

    return recommendations
  }

  const handleRefresh = async () => {
    if (userLocation) {
      await fetchAQIData(userLocation.lat, userLocation.lon)
    } else {
      await detectUserLocation()
    }
  }

  const handleDownloadReport = () => {
  if (!aqiData) return
  
  // Try different possible PDF names in public folder
  const possiblePdfNames = [
    '/resume.pdf',
    '/report.pdf', 
    '/air-quality-report.pdf',
    '/sample-report.pdf',
    '/demo-report.pdf'
  ]
  
  // Create a link and try to download
  const link = document.createElement('a')
  link.download = `aqi-report-${aqiData.city}-${new Date().toISOString().split('T')[0]}.pdf`
  
  // Try the first PDF name (you can modify this logic)
  link.href = possiblePdfNames[0]
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  console.log("Attempting to download PDF from:", possiblePdfNames[0])
}

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Detecting your location...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="stars"></div>
      <Navigation />

      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">User Dashboards</h1>
            <p className="text-lg text-muted-foreground">
              Role-based interfaces for different user types and use cases
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setShowCitySearch(true)}
              >
                <Search className="w-4 h-4 mr-2" />
                Select City Manually
              </Button>
            </div>
          )}

          {showCitySearch && (
            <Card className="mb-6 bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Select Your City</CardTitle>
                <CardDescription>Search for your exact location to get accurate AQI data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Search for your city..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        searchCities(e.target.value)
                      }}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background"
                    />
                    <Button onClick={() => setShowCitySearch(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                  
                  {searching && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
                      {searchResults.map((city, index) => (
                        <div
                          key={`${city.name}-${index}`}
                          className="p-3 hover:bg-secondary/20 cursor-pointer border-b border-border last:border-b-0"
                          onClick={() => handleCitySelect(city)}
                        >
                          <div className="font-medium">{city.name}</div>
                          <div className="text-sm text-muted-foreground">{city.state}, {city.country}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery && searchResults.length === 0 && !searching && (
                    <div className="text-center py-4 text-muted-foreground">
                      No cities found. Try a different search term.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="citizen" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Citizen</span>
              </TabsTrigger>
              <TabsTrigger value="policymaker" className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Policy Maker</span>
              </TabsTrigger>
              <TabsTrigger value="researcher" className="flex items-center space-x-2">
                <Microscope className="w-4 h-4" />
                <span>Researcher</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </TabsTrigger>
            </TabsList>

            {/* Citizen Dashboard - COMPLETE VERSION */}
            <TabsContent value="citizen" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Current Location AQI */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        Your Location
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowCitySearch(true)}
                          className="h-8 px-2"
                          title="Change location"
                        >
                          <Search className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleRefresh}
                          disabled={refreshing}
                          className="h-8 px-2"
                        >
                          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {aqiData?.location || "Getting location..."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      {aqiData && (
                        <>
                          <div className={`w-20 h-20 ${getAQILevel(aqiData.aqi).color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                            <span className="text-2xl font-bold text-white">{aqiData.aqi}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getAQILevel(aqiData.aqi).textColor} bg-opacity-10 border-opacity-20`}
                          >
                            {getAQILevel(aqiData.aqi).level}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-2">
                            Last updated: {aqiData.lastUpdated}
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Health Recommendations */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="w-5 h-5 mr-2 text-red-400" />
                      Health Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aqiData && getHealthRecommendations(aqiData.aqi).map((rec, index) => (
                      <div 
                        key={index} 
                        className={`flex items-start space-x-2 p-3 rounded-lg border ${rec.bgColor} ${rec.borderColor}`}
                      >
                        <div className={`w-2 h-2 mt-2 flex-shrink-0 rounded-full ${
                          rec.color === 'green' ? 'bg-green-400' :
                          rec.color === 'yellow' ? 'bg-yellow-400' :
                          rec.color === 'orange' ? 'bg-orange-400' :
                          rec.color === 'red' ? 'bg-red-400' : 'bg-blue-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{rec.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-transparent hover:text-gray-400" 
                      onClick={handleDownloadReport}
                      disabled={!aqiData}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Set Alerts
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Trends
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Forecast - NOW VISIBLE */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>7-Day AQI Forecast</CardTitle>
                  <CardDescription>Predicted air quality levels for your location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
                    {forecastData.map((dayData, index) => {
                      const aqiLevel = getAQILevel(dayData.aqi)
                      return (
                        <div key={`${dayData.day}-${index}`} className="text-center">
                          <p className="text-sm font-medium text-foreground mb-2">{dayData.day}</p>
                          <div
                            className={`w-12 h-12 ${aqiLevel.color} rounded-full flex items-center justify-center mx-auto mb-2`}
                          >
                            <span className="text-sm font-bold text-white">{dayData.aqi}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {aqiLevel.level.split(' ')[0]}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Pollutant Details - NOW VISIBLE */}
              {aqiData && (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Pollutant Details</CardTitle>
                    <CardDescription>Current pollutant levels in your area (μg/m³)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(aqiData.components).map(([key, value]) => (
                        <div key={key} className="text-center p-3 bg-secondary/20 rounded-lg">
                          <p className="text-sm font-medium capitalize">{key.replace('_', '.')}</p>
                          <p className="text-lg font-bold text-primary">{value.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">μg/m³</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Policy Maker Dashboard */}
            <TabsContent value="policymaker" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Regional Hotspots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-400">12</div>
                    <p className="text-sm text-muted-foreground">Areas above 150 AQI</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Population Affected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-400">2.3M</div>
                    <p className="text-sm text-muted-foreground">People in unhealthy zones</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Trend Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">-8%</div>
                    <p className="text-sm text-muted-foreground">Improvement this month</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Policy Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">85%</div>
                    <p className="text-sm text-muted-foreground">Compliance rate</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Regional Trends
                    </CardTitle>
                    <CardDescription>AQI changes across different regions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { region: "Delhi NCR", change: "+12%", trend: "up", color: "text-red-400" },
                        { region: "Mumbai Metro", change: "-5%", trend: "down", color: "text-green-400" },
                        { region: "Bangalore", change: "-2%", trend: "down", color: "text-green-400" },
                        { region: "Chennai", change: "+8%", trend: "up", color: "text-orange-400" },
                      ].map((item) => (
                        <div
                          key={item.region}
                          className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                        >
                          <span className="font-medium">{item.region}</span>
                          <span className={`font-bold ${item.color}`}>{item.change}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Policy Simulation Tools</CardTitle>
                    <CardDescription>Impact assessment for proposed policies</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Vehicle Emission Standards
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <Building2 className="w-4 h-4 mr-2" />
                      Industrial Regulations
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <Globe className="w-4 h-4 mr-2" />
                      Green Zone Expansion
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <Download className="w-4 h-4 mr-2" />
                      Export Analysis
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Health Researcher Dashboard */}
            <TabsContent value="researcher" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Data Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">1.2M</div>
                    <p className="text-sm text-muted-foreground">AQI measurements collected</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Correlations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">0.78</div>
                    <p className="text-sm text-muted-foreground">AQI-Health correlation</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Studies Active</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-chart-4">15</div>
                    <p className="text-sm text-muted-foreground">Ongoing research projects</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Health Impact Analysis
                    </CardTitle>
                    <CardDescription>Correlation between AQI and health outcomes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { condition: "Respiratory Issues", correlation: "0.82", impact: "High" },
                        { condition: "Cardiovascular Disease", correlation: "0.67", impact: "Medium" },
                        { condition: "Asthma Episodes", correlation: "0.91", impact: "Very High" },
                        { condition: "Hospital Admissions", correlation: "0.74", impact: "High" },
                      ].map((item) => (
                        <div
                          key={item.condition}
                          className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.condition}</p>
                            <p className="text-sm text-muted-foreground">Correlation: {item.correlation}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              item.impact === "Very High"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : item.impact === "High"
                                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }
                          >
                            {item.impact}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Research Tools</CardTitle>
                    <CardDescription>Data analysis and visualization tools</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Statistical Analysis
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Trend Visualization
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <Database className="w-4 h-4 mr-2" />
                      Export Datasets
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <Microscope className="w-4 h-4 mr-2" />
                      Custom Queries
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Admin Dashboard */}
            <TabsContent value="admin" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Data Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">247</div>
                    <p className="text-sm text-muted-foreground">Active sensors</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Data Quality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">94%</div>
                    <p className="text-sm text-muted-foreground">Validation success rate</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">99.2%</div>
                    <p className="text-sm text-muted-foreground">Uptime this month</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">API Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">1.8M</div>
                    <p className="text-sm text-muted-foreground">Requests today</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="w-5 h-5 mr-2" />
                      Data Source Management
                    </CardTitle>
                    <CardDescription>Monitor and validate incoming data streams</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { source: "CPCB Sensors", status: "Active", quality: "98%" },
                        { source: "INSAT-3D Satellite", status: "Active", quality: "95%" },
                        { source: "MERRA-2 Data", status: "Active", quality: "92%" },
                        { source: "Private Sensors", status: "Warning", quality: "87%" },
                      ].map((item) => (
                        <div
                          key={item.source}
                          className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.source}</p>
                            <p className="text-sm text-muted-foreground">Quality: {item.quality}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              item.status === "Active"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }
                          >
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      System Administration
                    </CardTitle>
                    <CardDescription>Manage system configuration and performance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <Database className="w-4 h-4 mr-2" />
                      Database Management
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <Shield className="w-4 h-4 mr-2" />
                      User Access Control
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <Activity className="w-4 h-4 mr-2" />
                      Performance Monitoring
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent hover:text-gray-400">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      System Alerts
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}