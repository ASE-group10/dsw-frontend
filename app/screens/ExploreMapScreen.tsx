import { FC, useEffect, useRef, useState } from "react"
import {
  View,
  ViewStyle,
  Text,
  TextStyle,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  FlatList,
  Animated,
  Easing,
  ActivityIndicator,
  LogBox,
  Share,
  Platform,
} from "react-native"
import * as Location from "expo-location"
import Constants from "expo-constants"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import MapView, { MarkerPressEvent } from "react-native-maps"

// Theme & UI utilities
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"

// Components & API
import { MapViewComponent } from "@/components/MapViewComponent"
import { LegendComponent } from "@/components/LegendComponent"
import { StopItem } from "@/components/StopItem"
import { apiRoute, apiUser } from "@/services/api"

const { width: _width, height } = Dimensions.get("window")
const googleApiKey = Constants.expoConfig?.extra?.MAPS_API_KEY || ""

// Store logs in memory for development debugging
let errorLogs: string[] = []

// Helper function to log errors
const logError = async (error: any, context: string) => {
  const timestamp = new Date().toISOString()
  const errorMessage = error?.message || String(error)
  const stack = error?.stack ? `\nStack: ${error.stack}` : ""
  const logEntry = `${timestamp} [${context}]: ${errorMessage}${stack}\n`

  console.error(logEntry)
  errorLogs.push(logEntry)
}

// Helper function to share logs
const shareLogs = async () => {
  try {
    if (errorLogs.length === 0) {
      Alert.alert("No Logs", "No error logs found.")
      return
    }

    await Share.share({
      message: errorLogs.join("\n"),
      title: "Application Logs",
    })
  } catch (error) {
    console.error("Error sharing logs:", error)
    Alert.alert("Error", "Failed to share logs.")
  }
}

// Helper function to clear logs
const clearLogs = () => {
  errorLogs = []
  Alert.alert("Success", "Logs cleared successfully")
}

// ---------------------- CONSTANTS & MAPPINGS ---------------------- //
const DEFAULT_MODE = "car"

const uiToApiMapping: { [key: string]: string } = {
  car: "car",
  walk: "walk",
  bus: "bus",
  cycle: "bike",
}

const modeThreshold = (mode: string): number => {
  switch (mode) {
    case "walk":
      return 25
    case "cycle":
      return 45
    case "bus":
      return 45
    case "car":
    default:
      return 50
  }
}

// ---------------------- TYPES ---------------------- //
type Coordinate = { latitude: number; longitude: number }

type Stop = Coordinate & { name: string }

type JourneyHistoryItem =
  | {
      type: "stop"
      stopName?: string
      waypoint: Coordinate
      timestamp: number
    }
  | {
      type: "waypoint"
      waypoint: Coordinate
      timestamp: number
    }

type JourneyHistory = {
  waypoints: JourneyHistoryItem[]
}

// ---------------------- MAIN COMPONENT ---------------------- //
export const ExploreMapScreen: FC = function ExploreMapScreen() {
  const { themed, theme } = useAppTheme()

  // ----- State Declarations -----
  const [routeData, setRouteData] = useState<any>(null)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [routeId, setRouteId] = useState<string | null>(null)
  const [followsUser, setFollowsUser] = useState<boolean>(true)
  const [nextStopIndex, setNextStopIndex] = useState<number>(1)
  const [journeyStarted, setJourneyStarted] = useState<boolean>(false)
  const [selectedModes, setSelectedModes] = useState<{ [index: number]: string }>({})
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false)
  const [busRouteInfo, setBusRouteInfo] = useState<{
    routeNumber: string | null
    boardingStop: string | null
    destinationStop: string | null
  }>({
    routeNumber: null,
    boardingStop: null,
    destinationStop: null
  })
  const [routePolylines, setRoutePolylines] = useState<
    { mode: string; coordinates: { latitude: number; longitude: number }[] }[]
  >([])
  const [journeyWaypoints, setJourneyWaypoints] = useState<
    Array<{ mode: string; coordinate: { latitude: number; longitude: number } }>
  >([])
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  )
  const [stops, setStops] = useState<Stop[]>([])
  const [journeyHistory, setJourneyHistory] = useState<JourneyHistory>({
    waypoints: [],
  })

  // ----- Refs -----
  const nextStopIndexRef = useRef(nextStopIndex)
  const totalDistanceRef = useRef(0)
  const prevLocation = useRef<{ latitude: number; longitude: number } | null>(null)
  const mapRef = useRef<MapView>(null)
  const routeIdRef = useRef<string | null>(null)

  // 3) We’ll store the watch subscription here instead of an ID number
  const journeyWatchSubscription = useRef<Location.LocationSubscription | null>(null)

  const lastWaypointRef = useRef<Coordinate | null>(null)
  const totalWaypointsRef = useRef(0)
  const journeyEndedRef = useRef(false)
  const journeyWaypointsRef = useRef(journeyWaypoints)
  const journeyHistoryRef = useRef(journeyHistory)
  const offRouteCountRef = useRef(0)
  const offRouteTimestampRef = useRef<number | null>(null)

  // ----- Animation -----
  const expandedHeight = height * 0.34
  const collapsedHeight = 170
  const bottomHeightAnim = useRef(new Animated.Value(expandedHeight)).current

  // ---------------------- EFFECTS ---------------------- //
  useEffect(() => {
    journeyWaypointsRef.current = journeyWaypoints
  }, [journeyWaypoints])

  useEffect(() => {
    journeyHistoryRef.current = journeyHistory
  }, [journeyHistory])

  useEffect(() => {
    nextStopIndexRef.current = nextStopIndex
  }, [nextStopIndex])

  useEffect(() => {
    Animated.timing(bottomHeightAnim, {
      toValue: collapsed ? collapsedHeight : expandedHeight,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start()
  }, [collapsed])

  // On mount, we attempt to get user’s location once
  useEffect(() => {
    let mounted = true
    const locationSubscription: Location.LocationSubscription | null = null

    const setupLocation = async () => {
      try {
        // First check if permissions are already granted
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync()
        await logError(
          { message: `Initial permission status: ${existingStatus}` },
          "Permission Check",
        )

        if (existingStatus === Location.PermissionStatus.GRANTED) {
          // If already granted, just get location
          if (mounted) {
            try {
              await getUserLocation()
            } catch (error) {
              await logError(error, "GetUserLocation after permission granted")
            }
          }
        } else {
          // If not granted, request permissions
          const { status } = await Location.requestForegroundPermissionsAsync()
          await logError({ message: `Permission request result: ${status}` }, "Permission Request")

          if (status !== Location.PermissionStatus.GRANTED) {
            if (mounted) {
              await logError({ message: "Permission denied by user" }, "Permission Denial")
              return
            }
          }

          // Add delay after permission grant
          await new Promise((resolve) => setTimeout(resolve, 2000))

          if (mounted) {
            // Check location services
            try {
              const enabled = await Location.hasServicesEnabledAsync()
              await logError({ message: `Location services enabled: ${enabled}` }, "Services Check")

              if (!enabled) {
                Alert.alert(
                  "Location Services Disabled",
                  "Please enable location services in your device settings.",
                  [{ text: "OK" }],
                )
                return
              }

              await getUserLocation()
            } catch (error) {
              await logError(error, "Location Services Check")
            }
          }
        }
      } catch (error) {
        if (mounted) {
          await logError(error, "Setup Location")
        }
      }
    }

    setupLocation()

    // Cleanup function
    return () => {
      mounted = false
      if (locationSubscription) {
        locationSubscription.remove()
      }
    }
  }, [])

  // ---------------------- HELPER FUNCTIONS ---------------------- //

  // 4) Replace Geolocation.getCurrentPosition with expo-location
  const getUserLocation = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        // Skip permission check since it's handled in setupLocation
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        if (!location || !location.coords) {
          const error = new Error("Invalid location data received")
          await logError(error, "GetUserLocation - Invalid Data")
          throw error
        }

        const { latitude, longitude, heading } = location.coords

        // Validate coordinates
        if (
          isNaN(latitude) ||
          isNaN(longitude) ||
          Math.abs(latitude) > 90 ||
          Math.abs(longitude) > 180
        ) {
          const error = new Error(`Invalid coordinates received: ${latitude},${longitude}`)
          await logError(error, "GetUserLocation - Invalid Coordinates")
          throw error
        }

        setUserLocation({ latitude, longitude })
        resolve({ latitude, longitude, heading })
      } catch (error) {
        await logError(error, "GetUserLocation")
        reject(error)
      }
    })
  }

  const addStop = (latitude: number, longitude: number, name: string) => {
    setStops((prevStops) => {
      let newStops: typeof prevStops = []
      // If no stops exist yet and userLocation is available, add it as the first stop
      if (prevStops.length === 0 && userLocation) {
        newStops = [
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            name: "Current Location",
          },
          { latitude, longitude, name },
        ]
      } else {
        // Determine how many manual stops
        const manualStopsCount =
          prevStops.length > 0 && prevStops[0].name === "Current Location"
            ? prevStops.length - 1
            : prevStops.length
        if (manualStopsCount >= 5) {
          Alert.alert("Stop Limit Reached", "Maximum of 5 stops allowed.")
          return prevStops
        }
        newStops = [...prevStops, { latitude, longitude, name }]
      }

      // The new stop’s index is at the end
      const newIndex = newStops.length - 1
      setSelectedModes((prevModes) => ({
        ...prevModes,
        [newIndex]: DEFAULT_MODE,
      }))
      return newStops
    })
  }

  const addSearchLocationAsStop = async () => {
    if (journeyStarted) {
      Alert.alert("Journey in Progress", "Cannot add new stop while journey is active.")
      return
    }
    if (!searchQuery.trim()) {
      Alert.alert("Invalid Input", "Please enter a valid location.")
      return
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchQuery,
      )}&key=${googleApiKey}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location
        const name = data.results[0].formatted_address
        addStop(lat, lng, name)
        setSearchQuery("")
      } else {
        Alert.alert("Location Not Found", "Please try a different search.")
      }
    } catch (error) {
      Alert.alert("Network Error", "Failed to connect. Please check your internet connection.")
    }
  }

  const handleMapLongPress = async (e: MarkerPressEvent) => {
    if (journeyStarted) return

    const { latitude, longitude } = e.nativeEvent.coordinate
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status === "OK" && data.results.length > 0) {
        const name = data.results[0].formatted_address
        addStop(latitude, longitude, name)
      } else {
        addStop(latitude, longitude, `Stop (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
      }
    } catch (error) {
      Alert.alert("Network Error", "Failed to reverse-geocode this location.")
    }
  }

  const removeStop = (index: number) => {
    setRoutePolylines([])
    setStops((prev) => prev.filter((_, i) => i !== index))
    setSelectedModes((prev) => {
      const updated = { ...prev }
      delete updated[index]
      return updated
    })
  }

  const handleSelectMode = (index: number, mode: string) => {
    setSelectedModes((prev) => ({
      ...prev,
      [index]: mode,
    }))
  }

  const stopHit = (stopIndex: number) => {
    setJourneyHistory((prev): JourneyHistory => {
      const alreadyHit = prev.waypoints.find(
        (item) =>
          item.type === "stop" &&
          item.waypoint.latitude === stops[stopIndex].latitude &&
          item.waypoint.longitude === stops[stopIndex].longitude,
      )
      if (alreadyHit) return prev

      const newStop: JourneyHistoryItem = {
        type: "stop",
        stopName: stops[stopIndex].name,
        waypoint: { latitude: stops[stopIndex].latitude, longitude: stops[stopIndex].longitude },
        timestamp: Date.now(),
      }
      return {
        ...prev,
        waypoints: [...prev.waypoints, newStop],
      }
    })
  }

  const handleGetRoute = async () => {
    await getUserLocation()

    setIsLoadingRoute(true)
    try {
      const points: [number, number][] = stops.map((stop) => [stop.longitude, stop.latitude])
      const segmentModes = stops
        .slice(1)
        .map((_, index) => uiToApiMapping[selectedModes[index]] || DEFAULT_MODE)

      const response = await apiRoute.getMultiStopNavigationRoute(points, segmentModes)

      if (response.ok && response.data) {
        console.log("Route data:", response.data)
        setRouteData(response.data)
        // Store the estimated time from API response
        setEstimatedTime(response.data.total_time || null)

        if (response.data.segments && Array.isArray(response.data.segments)) {
          const newPolylines: {
            mode: string
            coordinates: { latitude: number; longitude: number }[]
          }[] = []
          const allWaypoints: Array<{
            mode: string
            coordinate: { latitude: number; longitude: number }
          }> = []

          response.data.segments.forEach((segment: any) => {
            const segMode = segment.mode || "unknown"
            
            // Extract bus route information
            if (segMode === "bus" && segment.paths) {
              segment.paths.forEach((path: any) => {
                if (path.instructions && Array.isArray(path.instructions)) {
                  const boardingInstruction = path.instructions.find((instr: any) => 
                    instr.text && instr.text.startsWith("Board bus route")
                  )
                  if (boardingInstruction) {
                    const routeMatch = boardingInstruction.text.match(/Board bus route ([^\s]+)/)
                    if (routeMatch) {
                      // Extract just the bus number from the route identifier
                      // Format is typically: xx-BusNumber-xxx-x.xx.x
                      const fullRouteId = routeMatch[1]
                      const parts = fullRouteId.split('-')
                      if (parts.length >= 2) {
                        const busNumber = parts[1] // Get the second part which contains the actual bus number
                        setBusRouteInfo({
                          routeNumber: busNumber,
                          boardingStop: "Bus Stop",
                          destinationStop: "Final Stop"
                        })
                      }
                    }
                  }
                }
              })
            }

            if (segment.points && Array.isArray(segment.points)) {
              const coords = segment.points.map((pt: [number, number]) => ({
                latitude: pt[1],
                longitude: pt[0],
              }))
              newPolylines.push({ mode: segMode, coordinates: coords })
              coords.forEach((coord) => {
                allWaypoints.push({ mode: segMode, coordinate: coord })
              })
            }
            if (segment.paths && Array.isArray(segment.paths)) {
              segment.paths.forEach((path: any) => {
                if (path.points && Array.isArray(path.points)) {
                  const pathCoords = path.points.map((pt: [number, number]) => ({
                    latitude: pt[1],
                    longitude: pt[0],
                  }))
                  newPolylines.push({ mode: path.mode || segMode, coordinates: pathCoords })
                  pathCoords.forEach((coord) => {
                    allWaypoints.push({ mode: path.mode || segMode, coordinate: coord })
                  })
                }
              })
            }
          })

          setRoutePolylines(newPolylines)
          setJourneyWaypoints(allWaypoints)
          totalWaypointsRef.current = allWaypoints.length
        }

        // After success, collapse the bottom section
        setCollapsed(true)
      } else {
        console.error("Route API Error:", response.problem)
        Alert.alert("Error", "Unable to calculate route. Please try again.")
      }
    } catch (error) {
      console.error("Route Fetch Error:", error)
      Alert.alert("Error", "Something went wrong while fetching the route.")
    } finally {
      setIsLoadingRoute(false)
    }
  }

  // Haversine distance
  const haversineDistance = (coords1: Coordinate, coords2: Coordinate) => {
    const toRad = (x: number) => (x * Math.PI) / 180
    const R = 6371000
    const lat1 = toRad(coords1.latitude)
    const lat2 = toRad(coords2.latitude)
    const deltaLat = toRad(coords2.latitude - coords1.latitude)
    const deltaLon = toRad(coords2.longitude - coords1.longitude)
    const a =
      Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // 5) Replace Geolocation.watchPosition with expo-location’s watchPositionAsync
  const trackJourneyProgress = async () => {
    // Clear old subscription if any
    if (journeyWatchSubscription.current) {
      await journeyWatchSubscription.current.remove()
      journeyWatchSubscription.current = null
    }

    // Start watching
    journeyWatchSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 1, // same as distanceFilter
        timeInterval: 1000, // same as interval
        // There's no direct "fastestInterval" in expo-location
      },
      (location) => {
        const { latitude, longitude, heading } = location.coords

        // Distance calculation
        if (prevLocation.current) {
          const distance = haversineDistance(prevLocation.current, { latitude, longitude })
          totalDistanceRef.current += distance
        }
        prevLocation.current = { latitude, longitude }
        setUserLocation({ latitude, longitude })

        if (mapRef.current) {
          mapRef.current.animateCamera(
            {
              center: { latitude, longitude },
              heading: heading || 0,
              zoom: 18,
              pitch: 45,
            },
            { duration: 500 },
          )
        }

        // Check next waypoint
        if (journeyWaypointsRef.current && journeyWaypointsRef.current.length > 0) {
          const nextWaypoint = journeyWaypointsRef.current[0]
          if (nextWaypoint && nextWaypoint.coordinate) {
            const distanceToNext = haversineDistance(
              { latitude, longitude },
              nextWaypoint.coordinate,
            )
            const thresholdForWaypoint = modeThreshold(nextWaypoint.mode)
            if (distanceToNext <= thresholdForWaypoint) {
              addWaypointToHistory(nextWaypoint.coordinate)
              lastWaypointRef.current = nextWaypoint.coordinate
              setJourneyWaypoints((prev) => prev.slice(1))
            }
          }
        }

        // Check next stop
        const startingStopIndex = 1
        if (
          nextStopIndexRef.current >= startingStopIndex &&
          nextStopIndexRef.current < stops.length
        ) {
          const nextStop = stops[nextStopIndexRef.current]
          const distanceToStop = haversineDistance(
            { latitude, longitude },
            { latitude: nextStop.latitude, longitude: nextStop.longitude },
          )
          const alreadyHit = journeyHistoryRef.current.waypoints.find(
            (item) =>
              item.type === "stop" &&
              item.waypoint.latitude === nextStop.latitude &&
              item.waypoint.longitude === nextStop.longitude,
          )
          const previousIndex = nextStopIndexRef.current - 1
          const modeForStop = selectedModes[previousIndex] || DEFAULT_MODE
          const thresholdForStop = modeThreshold(modeForStop)

          if (!alreadyHit && distanceToStop <= thresholdForStop) {
            stopHit(nextStopIndexRef.current)
            setNextStopIndex((prev) => {
              const newIndex = prev + 1
              nextStopIndexRef.current = newIndex
              return newIndex
            })
          } else if (alreadyHit) {
            setNextStopIndex((prev) => {
              const newIndex = prev + 1
              nextStopIndexRef.current = newIndex
              return newIndex
            })
          }
        }

        // Auto-trigger end-of-journey check
        if (
          !journeyEndedRef.current &&
          nextStopIndexRef.current >= stops.length &&
          totalWaypointsRef.current > 0
        ) {
          const travelledWaypointsCount =
            totalWaypointsRef.current - (journeyWaypointsRef.current?.length || 0)
          const percentageTravelled = travelledWaypointsCount / totalWaypointsRef.current
          if (percentageTravelled >= 0.8) {
            journeyEndedRef.current = true
            finishJourney()
          }
        }
      },
    )
  }

  const addWaypointToHistory = (waypoint: Coordinate) => {
    setJourneyHistory((prev): JourneyHistory => {
      const alreadyExists = prev.waypoints.find(
        (item) => item.type === "waypoint" && coordinatesAreEqual(item.waypoint, waypoint),
      )
      if (alreadyExists) return prev

      const newWaypoint: JourneyHistoryItem = {
        type: "waypoint",
        waypoint,
        timestamp: Date.now(),
      }
      return {
        ...prev,
        waypoints: [...prev.waypoints, newWaypoint],
      }
    })
  }

  const coordinatesAreEqual = (
    coord1: Coordinate,
    coord2: Coordinate,
    tolerance = 0.0001,
  ): boolean => {
    return (
      Math.abs(coord1.latitude - coord2.latitude) < tolerance &&
      Math.abs(coord1.longitude - coord2.longitude) < tolerance
    )
  }

  const handleJourneyToggle = async () => {
    if (!journeyStarted) {
      if (journeyWaypoints.length === 0) {
        Alert.alert("No Route", "Please calculate a route before starting the journey.")
        return
      }

      // Prepare waypoints for API
      const waypoints = journeyWaypoints.map((item) => item.coordinate)
      try {
        const response = await apiUser.startJourney(waypoints)
        if (response.ok && response.data) {
          console.log("Journey started successfully:", response.data)
          const id = String(response.data.routeId)
          setRouteId(id)
          routeIdRef.current = id
        } else {
          console.error("Failed to start journey:", response)
          Alert.alert("Error", "Unable to start journey. Please try again.")
          return
        }
      } catch (error) {
        console.error("Start journey error:", error)
        Alert.alert("Error", "Network error while starting journey.")
        return
      }

      totalDistanceRef.current = 0
      if (userLocation) {
        setJourneyHistory({
          waypoints: [
            {
              type: "stop",
              stopName: "Current Location",
              waypoint: { ...userLocation },
              timestamp: Date.now(),
            },
          ],
        })
      }
      setJourneyStarted(true)
      setFollowsUser(false)

      // Start location tracking
      await trackJourneyProgress()
    } else {
      if (!journeyEndedRef.current) {
        journeyEndedRef.current = true
        finishJourney()
      }
    }
  }

  const reroute = () => {
    if (!journeyEndedRef.current) {
      journeyEndedRef.current = true
      finishJourney()
    }

    Alert.alert(
      "Off Route Detected",
      "You have deviated significantly from the planned route. The journey has been automatically ended. Your journey information has been sent for rewards calculation. Please start a new journey.",
      [{ text: "OK" }],
    )
  }

  const finishJourney = async () => {
    const stopsFinished = journeyHistoryRef.current.waypoints.filter(
      (item) => item.type === "stop",
    ).length
    const totalStops = stops.length
    const totalDistanceFromApi =
      routeData && routeData.total_distance ? routeData.total_distance : totalDistanceRef.current
    const travelledDistance = totalDistanceRef.current
    const totalWaypoints = totalWaypointsRef.current || 0
    const travelledWaypointsCount = totalWaypoints - (journeyWaypointsRef.current?.length || 0)

    // Extract modes
    const modesOfTransport =
      routePolylines.length > 0 &&
      Array.from(new Set(routePolylines.map((poly) => poly.mode))).length > 1
        ? Array.from(new Set(routePolylines.map((poly) => poly.mode)))
        : stops.slice(1).map((_, index) => uiToApiMapping[selectedModes[index]] || DEFAULT_MODE)

    const journeyPayload = {
      routeId: routeIdRef.current,
      stopsFinished,
      totalStops,
      totalDistance: totalDistanceFromApi,
      travelledDistance,
      totalWaypoints,
      travelledWaypoints: travelledWaypointsCount,
      modesOfTransport,
      journeyHistory: journeyHistoryRef.current,
    }

    await postCompletedRouteDetails(journeyPayload)
    resetJourneyData()

    if (mapRef.current && userLocation) {
      mapRef.current.animateCamera(
        { center: userLocation, heading: 0, pitch: 0, zoom: 15 },
        { duration: 500 },
      )
    }
    setRoutePolylines([])
    setStops([])
    setRouteData(null)
    setSelectedModes({})
    setCollapsed(false)
  }

  // 6) Replace Geolocation.clearWatch with subscription.remove()
  const resetJourneyData = async () => {
    if (journeyWatchSubscription.current) {
      await journeyWatchSubscription.current.remove()
      journeyWatchSubscription.current = null
    }

    // Get the latest current location
    try {
      await getUserLocation()
    } catch (error) {
      console.error("Error getting current position on reset:", error)
    }

    setJourneyStarted(false)
    setFollowsUser(true)
    setJourneyHistory({ waypoints: [] })
    setJourneyWaypoints([])
    totalDistanceRef.current = 0
    setRoutePolylines([])
    setStops([])
    setRouteData(null)
    setSelectedModes({})
    prevLocation.current = null

    journeyEndedRef.current = false
    setNextStopIndex(1)
    nextStopIndexRef.current = 1
  }

  const postCompletedRouteDetails = async (details: {
    routeId: string | null
    stopsFinished: number
    totalStops: number
    totalDistance: number
    travelledDistance: number
    totalWaypoints: number
    travelledWaypoints: number
    modesOfTransport: string[]
    journeyHistory: JourneyHistory
  }) => {
    console.log("Posting route history details:", details)
    try {
      const response = await apiUser.completeJourney(details)
      if (response.ok) {
        console.log("Journey posted successfully:", response.data)
      } else {
        console.error("Failed to post journey details:", response)
        Alert.alert("Error", "Failed to post journey details.")
      }
    } catch (error) {
      console.error("Error posting journey details:", error)
      Alert.alert("Error", "An error occurred while posting journey details.")
    }
  }

  const toggleBottomSection = () => {
    setCollapsed((prev) => !prev)
  }

  // ---------------------- RENDER ---------------------- //
  return (
    <View style={themed($container)}>
      {userLocation && (
        <>
          <MapViewComponent
            userLocation={userLocation}
            mapRef={mapRef}
            followsUser={followsUser}
            handleMapLongPress={handleMapLongPress}
            stops={stops}
            routePolylines={routePolylines}
          />
        </>
      )}
      <Animated.View style={[themed($bottomAnimatedContainer), { height: bottomHeightAnim }]}>
        {collapsed ? (
          <View style={themed($collapsedContent)}>
            <LegendComponent />
            <View style={themed($routeInfoContainer)}>
              {estimatedTime && (
                <Text style={themed($estimatedTimeText)}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.textDim} />
                  {"est "}{Math.round(estimatedTime / 60000)}
                </Text>
              )}
              {busRouteInfo.routeNumber && (
                <View style={themed($busInfoContainer)}>
                  <MaterialCommunityIcons name="bus" size={14} color={theme.colors.text} />
                  <Text style={themed($busRouteText)}>Bus {busRouteInfo.routeNumber}</Text>
                </View>
              )}
            </View>
            <View style={themed($controlButtonsRow)}>
              <TouchableOpacity
                style={[
                  themed($startButton),
                  {
                    backgroundColor: journeyStarted ? theme.colors.error : theme.colors.tint,
                  },
                ]}
                onPress={handleJourneyToggle}
              >
                <View style={themed($buttonContent)}>
                  <Text style={themed($buttonText)}>
                    {journeyStarted ? "End Journey" : "Start Journey"}
                  </Text>
                  <MaterialCommunityIcons
                    name="road-variant"
                    size={20}
                    color={theme.colors.palette.neutral100}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleBottomSection} style={themed($expandButton)}>
                <MaterialCommunityIcons
                  name="chevron-up"
                  size={24}
                  color={theme.colors.palette.neutral100}
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={themed($bottomSectionContent)}>
            <LegendComponent />
            <View style={themed($searchRow)}>
              <View style={themed($searchBar)}>
                <TextInput
                  style={themed($searchInput)}
                  placeholder="Search for a stop"
                  placeholderTextColor={theme.colors.textDim}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  editable={!journeyStarted}
                />
                <TouchableOpacity
                  style={[
                    themed($stopButton),
                    journeyStarted && { backgroundColor: theme.colors.border },
                  ]}
                  onPress={addSearchLocationAsStop}
                  disabled={journeyStarted}
                >
                  <MaterialCommunityIcons
                    name="map-marker-plus"
                    size={24}
                    color={theme.colors.palette.neutral100}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  themed($routeButton),
                  (stops.length < 2 || isLoadingRoute) && { backgroundColor: theme.colors.border },
                ]}
                onPress={stops.length < 2 || isLoadingRoute ? undefined : handleGetRoute}
                disabled={stops.length < 2 || isLoadingRoute}
              >
                {isLoadingRoute ? (
                  <ActivityIndicator color={theme.colors.palette.neutral100} />
                ) : (
                  <MaterialCommunityIcons
                    name="map-search-outline"
                    size={24}
                    color={theme.colors.palette.neutral100}
                  />
                )}
              </TouchableOpacity>
              {routeData && routePolylines.length > 0 && (
                <TouchableOpacity style={themed($collapseButton)} onPress={toggleBottomSection}>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={24}
                    color={theme.colors.palette.neutral100}
                  />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={stops}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <StopItem
                  stop={item}
                  index={index}
                  totalStops={stops.length}
                  selectedMode={selectedModes[index]}
                  onRemove={removeStop}
                  onSelectMode={handleSelectMode}
                  disableRemove={journeyStarted}
                />
              )}
            />
          </View>
        )}
      </Animated.View>
    </View>
  )
}

// --------------------- THEMED STYLE FUNCTIONS --------------------- //

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

// Bottom Container Styles
const $bottomAnimatedContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  overflow: "hidden",
  backgroundColor: colors.background,
  borderTopLeftRadius: spacing.sm,
  borderTopRightRadius: spacing.sm,
  elevation: 5,
})

const $bottomSectionContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.sm,
})

const $collapsedContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: spacing.sm,
})

// Route Info Styles
const $routeInfoContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  marginTop: spacing.sm,
})

const $estimatedTimeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 13,
  marginTop: -4,
  marginBottom: 8,
  opacity: 1
})

const $busInfoContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.backgroundDim,
  paddingHorizontal: spacing.xs,
  paddingVertical: 4,
  borderRadius: spacing.xxs,
  marginLeft: spacing.sm
})

const $busRouteText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 13,
  fontWeight: "500",
  marginLeft: 4
})

// Search Styles
const $searchRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.md,
  justifyContent: "space-between",
})

const $searchBar: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  flexDirection: "row",
  backgroundColor: colors.background,
  padding: spacing.sm,
  borderRadius: spacing.xs,
  marginRight: spacing.sm,
  alignItems: "center",
})

const $searchInput: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
  borderRadius: spacing.xs,
  backgroundColor: colors.background,
  marginRight: spacing.sm,
  height: 40,
})

// Button Styles
const $controlButtonsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  flexDirection: "row",
  justifyContent: "center",
  marginTop: spacing.md,
})

const $startButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  borderRadius: spacing.sm,
  elevation: 4,
  flexDirection: "row",
  height: 50,
  justifyContent: "center",
  marginRight: spacing.sm,
  paddingHorizontal: spacing.md,
  width: 300,
})

const $buttonContent: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  flexDirection: "row",
})

const $buttonText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.neutral100,
  fontSize: 16,
  fontWeight: "600",
  marginRight: spacing.sm,
})

const $stopButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.error,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.sm,
  borderRadius: spacing.xs,
  alignItems: "center",
  justifyContent: "center",
})

const $routeButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 50,
  height: 50,
  backgroundColor: colors.tint,
  borderRadius: 25,
  alignItems: "center",
  justifyContent: "center",
})

const $expandButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  alignItems: "center",
  backgroundColor: colors.border,
  borderRadius: 25,
  height: 50,
  justifyContent: "center",
  width: 50,
})

const $collapseButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  alignItems: "center",
  backgroundColor: colors.border,
  borderRadius: 25,
  height: 50,
  justifyContent: "center",
  marginLeft: spacing.sm,
  width: 50,
})
