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
  const [userControlledCamera, setUserControlledCamera] = useState<boolean>(false)
  const [userZoomLevel, setUserZoomLevel] = useState<number>(18)
  const [userPitch, setUserPitch] = useState<number>(45)
  const [offRouteDistance, setOffRouteDistance] = useState<number>(0)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0)
  // ----- Refs -----
  const nextStopIndexRef = useRef(nextStopIndex)
  const totalDistanceRef = useRef(0)
  const prevLocation = useRef<{ latitude: number; longitude: number } | null>(null)
  const mapRef = useRef<MapView>(null)
  const routeIdRef = useRef<string | null>(null)
  const journeyStartedRef = useRef(journeyStarted)

  // 3) We'll store the watch subscription here instead of an ID number
  const journeyWatchSubscription = useRef<Location.LocationSubscription | null>(null)

  const lastWaypointRef = useRef<Coordinate | null>(null)
  const totalWaypointsRef = useRef(0)
  const journeyEndedRef = useRef(false)
  const journeyWaypointsRef = useRef(journeyWaypoints)
  const journeyHistoryRef = useRef(journeyHistory)
  const offRouteCountRef = useRef(0)
  const offRouteTimestampRef = useRef<number | null>(null)
  const currentSegmentIndexRef = useRef(0)
  const reroutingInProgressRef = useRef(false)

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
    journeyStartedRef.current = journeyStarted;
    console.log(`[JOURNEY_STATE] Journey started state updated to: ${journeyStarted}`);
  }, [journeyStarted]);

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
                      const fullRouteId = routeMatch[1]
                      const parts = fullRouteId.split('-')
                      if (parts.length >= 2) {
                        const busNumber = parts[1]
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
              coords.forEach((coord: { latitude: number; longitude: number }) => {
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
                  pathCoords.forEach((coord: { latitude: number; longitude: number }) => {
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
    const R = 6371 // Earth's radius in kilometers
    const lat1 = toRad(coords1.latitude)
    const lat2 = toRad(coords2.latitude)
    const deltaLat = toRad(coords2.latitude - coords1.latitude)
    const deltaLon = toRad(coords2.longitude - coords1.longitude)
    const a =
      Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c * 1000 // Convert to meters
  }

  // 5) Replace Geolocation.watchPosition with expo-location's watchPositionAsync
  const trackJourneyProgress = async () => {
    try {
      console.log("[LOCATION] Starting journey tracking...");
      
      // Clear old subscription if any
      if (journeyWatchSubscription.current) {
        try {
          await journeyWatchSubscription.current.remove();
        } catch (error) {
          console.error("[LOCATION] Error removing previous subscription:", error);
        }
        journeyWatchSubscription.current = null;
      }

      // Make sure we have location permissions before proceeding
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        console.error("[LOCATION] Location permissions not granted");
        Alert.alert(
          "Location Permission Required", 
          "Please enable location permissions to track your journey."
        );
        return;
      }

      // Start watching with error handling
      try {
        console.log("[LOCATION] Setting up location watcher with high accuracy...");
        
        journeyWatchSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 1, // same as distanceFilter
            timeInterval: 1000, // same as interval
          },
          (location) => {
            console.log(`[LOCATION] Received location update: ${JSON.stringify(location.coords)}`);
            
            if (!location || !location.coords) {
              console.error("[LOCATION] Invalid location update received");
              return;
            }
            
            try {
              const { latitude, longitude, heading } = location.coords;
              
              // Validate coordinates to prevent crashes
              if (isNaN(latitude) || isNaN(longitude) || 
                  Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
                console.error(`[LOCATION] Invalid coordinates: ${latitude},${longitude}`);
                return;
              }

              // Distance calculation
              if (prevLocation.current) {
                const distance = haversineDistance(prevLocation.current, { latitude, longitude });
                totalDistanceRef.current += distance;
              }
              
              prevLocation.current = { latitude, longitude };
              setUserLocation({ latitude, longitude });

              // Check if the user is off-route (if journey is active)
              if (journeyStartedRef.current && routePolylines.length > 0) {
                console.log(`[ROUTE_CHECK] Checking if user is off route. Journey started: ${journeyStartedRef.current}, Polylines: ${routePolylines.length}`);
                try {
                  // Update which segment the user is currently in
                  updateCurrentSegment({ latitude, longitude });
                  
                  // Calculate distance from route
                  const distanceFromRoute = distanceToRoute({ latitude, longitude });
                  console.log(`[ROUTE_CHECK] Distance from route calculated: ${distanceFromRoute.toFixed(2)}m`);
                  setOffRouteDistance(distanceFromRoute);
                  
                  console.log(`[REROUTE] Distance from route: ${distanceFromRoute.toFixed(2)}m, Current segment: ${currentSegmentIndexRef.current}, Off-route threshold: 30m`);
                  
                  // If distance is greater than 30m, increment the off-route counter
                  if (distanceFromRoute > 30) {
                    console.log(`[ROUTE_CHECK] User is off route (${distanceFromRoute.toFixed(2)}m > 30m threshold)`);
                    // Check if this is the first off-route detection
                    if (!offRouteTimestampRef.current) {
                      offRouteTimestampRef.current = Date.now();
                      console.log(`[REROUTE] User went off-route at ${new Date().toISOString()}, starting timer`);
                    }
                    
                    // If user has been off route for at least 5 seconds, trigger reroute
                    const timeOffRoute = offRouteTimestampRef.current ? (Date.now() - offRouteTimestampRef.current) / 1000 : 0;
                    console.log(`[REROUTE] Time off-route: ${timeOffRoute.toFixed(1)} seconds`);
                    
                    if (offRouteTimestampRef.current && Date.now() - offRouteTimestampRef.current >= 5000) {
                      console.log(`[REROUTE] Triggering reroute after ${timeOffRoute.toFixed(1)} seconds off-route`);
                      offRouteTimestampRef.current = null;
                      handleReroute();
                    }
                  } else {
                    // Reset the off-route timer if user is back on route
                    if (offRouteTimestampRef.current) {
                      console.log(`[REROUTE] User back on route, resetting timer`);
                      offRouteTimestampRef.current = null;
                    }
                  }
                } catch (error) {
                  console.error("[LOCATION] Error in route detection:", error);
                }
              } else {
                console.log(`[ROUTE_CHECK] Skipping route check. Journey started: ${journeyStartedRef.current}, Polylines count: ${routePolylines.length}`);
              }

              if (mapRef.current) {
                try {
                  mapRef.current.animateCamera(
                    {
                      center: { latitude, longitude },
                      heading: heading || 0,
                      zoom: userControlledCamera ? userZoomLevel : 18,
                      pitch: userControlledCamera ? userPitch : 45,
                    },
                    { duration: 500 },
                  );
                } catch (error) {
                  console.error("[LOCATION] Error updating camera:", error);
                }
              }

              // Check next waypoint with error handling
              try {
                if (journeyWaypointsRef.current && journeyWaypointsRef.current.length > 0) {
                  const nextWaypoint = journeyWaypointsRef.current[0];
                  if (nextWaypoint && nextWaypoint.coordinate) {
                    const distanceToNext = haversineDistance(
                      { latitude, longitude },
                      nextWaypoint.coordinate,
                    );
                    const thresholdForWaypoint = modeThreshold(nextWaypoint.mode);
                    if (distanceToNext <= thresholdForWaypoint) {
                      addWaypointToHistory(nextWaypoint.coordinate);
                      lastWaypointRef.current = nextWaypoint.coordinate;
                      setJourneyWaypoints((prev) => prev.slice(1));
                    }
                  }
                }
              } catch (error) {
                console.error("[LOCATION] Error checking waypoints:", error);
              }

              // Check next stop with error handling
              try {
                const startingStopIndex = 1;
                if (
                  nextStopIndexRef.current >= startingStopIndex &&
                  nextStopIndexRef.current < stops.length
                ) {
                  const nextStop = stops[nextStopIndexRef.current];
                  const distanceToStop = haversineDistance(
                    { latitude, longitude },
                    { latitude: nextStop.latitude, longitude: nextStop.longitude },
                  );
                  const alreadyHit = journeyHistoryRef.current.waypoints.find(
                    (item) =>
                      item.type === "stop" &&
                      item.waypoint.latitude === nextStop.latitude &&
                      item.waypoint.longitude === nextStop.longitude,
                  );
                  const previousIndex = nextStopIndexRef.current - 1;
                  const modeForStop = selectedModes[previousIndex] || DEFAULT_MODE;
                  const thresholdForStop = modeThreshold(modeForStop);

                  if (!alreadyHit && distanceToStop <= thresholdForStop) {
                    stopHit(nextStopIndexRef.current);
                    setNextStopIndex((prev) => {
                      const newIndex = prev + 1;
                      nextStopIndexRef.current = newIndex;
                      return newIndex;
                    });
                  } else if (alreadyHit) {
                    setNextStopIndex((prev) => {
                      const newIndex = prev + 1;
                      nextStopIndexRef.current = newIndex;
                      return newIndex;
                    });
                  }
                }
              } catch (error) {
                console.error("[LOCATION] Error checking stops:", error);
              }

              // Auto-trigger end-of-journey check with error handling
              try {
                if (
                  !journeyEndedRef.current &&
                  nextStopIndexRef.current >= stops.length &&
                  totalWaypointsRef.current > 0
                ) {
                  const travelledWaypointsCount =
                    totalWaypointsRef.current - (journeyWaypointsRef.current?.length || 0);
                  const percentageTravelled = travelledWaypointsCount / totalWaypointsRef.current;
                  if (percentageTravelled >= 0.8) {
                    journeyEndedRef.current = true;
                    finishJourney();
                  }
                }
              } catch (error) {
                console.error("[LOCATION] Error in journey completion check:", error);
              }
            } catch (error) {
              console.error("[LOCATION] Error processing location update:", error);
            }
          },
        );
        
        console.log("[LOCATION] Location tracking started successfully");
      } catch (error) {
        console.error("[LOCATION] Failed to start location tracking:", error);
        Alert.alert(
          "Location Error", 
          "Failed to start location tracking. Please try again."
        );
      }
    } catch (error) {
      console.error("[LOCATION] Error in trackJourneyProgress:", error);
      Alert.alert(
        "Error", 
        "An unexpected error occurred when starting journey tracking."
      );
    }
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
        console.log("[JOURNEY] Sending start journey request to API...")
        const response = await apiUser.startJourney(waypoints)
        if (response.ok && response.data) {
          console.log("[JOURNEY] Journey started successfully:", response.data)
          const id = String(response.data.routeId)
          setRouteId(id)
          routeIdRef.current = id
          
          // Create journey history
          if (userLocation) {
            try {
              // Get actual location name using reverse geocoding
              const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLocation.latitude},${userLocation.longitude}&key=${googleApiKey}`
              const response = await fetch(url)
              const data = await response.json()
              
              const locationName = data.status === "OK" && data.results.length > 0 
                ? data.results[0].formatted_address 
                : `Location (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)})`

              setJourneyHistory({
                waypoints: [
                  {
                    type: "stop",
                    stopName: locationName,
                    waypoint: { ...userLocation },
                    timestamp: Date.now(),
                  },
                ],
              })
            } catch (error) {
              console.error("Error getting location name:", error)
              // Fallback to coordinates if geocoding fails
              setJourneyHistory({
                waypoints: [
                  {
                    type: "stop",
                    stopName: `Location (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)})`,
                    waypoint: { ...userLocation },
                    timestamp: Date.now(),
                  },
                ],
              })
            }
          }
          
          // Reset tracking values
          totalDistanceRef.current = 0;
          offRouteCountRef.current = 0;
          offRouteTimestampRef.current = null;
          
          console.log("[JOURNEY] Setting journey started to true");
          // Set the journey started state BEFORE starting location tracking
          setJourneyStarted(true);
          
          // Start location tracking only after updating state
          await trackJourneyProgress();
          
          console.log("[JOURNEY] Journey and tracking initialized successfully");
          setFollowsUser(false)
        } else {
          console.error("[JOURNEY] Failed to start journey:", response)
          Alert.alert("Error", "Unable to start journey. Please try again.")
          return
        }
      } catch (error) {
        console.error("[JOURNEY] Start journey error:", error)
        Alert.alert("Error", "Network error while starting journey.")
        return
      }
    } else {
      console.log("[JOURNEY] Ending journey...")
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

  // Calculate distance from a point to the polyline (route)
  const distanceToRoute = (position: Coordinate): number => {
    console.log(`[DEBUG] distanceToRoute called with position: ${JSON.stringify(position)}`);
    
    if (!routePolylines.length) {
      console.log("[REROUTE] No route polylines available");
      return Infinity;
    }
    
    console.log(`[DEBUG] routePolylines length: ${routePolylines.length}, currentSegmentIndex: ${currentSegmentIndexRef.current}`);
    
    // Find the current segment the user is in
    const currentPolyline = routePolylines[currentSegmentIndexRef.current];
    if (!currentPolyline) {
      console.log(`[DEBUG] No polyline found for segment index ${currentSegmentIndexRef.current}`);
      return Infinity;
    }
    
    if (!currentPolyline.coordinates || !currentPolyline.coordinates.length) {
      console.log(`[DEBUG] Invalid coordinates in polyline for segment ${currentSegmentIndexRef.current}. Coordinates: ${JSON.stringify(currentPolyline.coordinates)}`);
      return Infinity;
    }
    
    console.log(`[DEBUG] Current polyline has ${currentPolyline.coordinates.length} coordinates, mode: ${currentPolyline.mode}`);
    
    // Find the minimum distance to any segment in the current polyline
    let minDistance = Infinity;
    let closestSegmentIndex = -1;
    
    for (let i = 0; i < currentPolyline.coordinates.length - 1; i++) {
      const segmentStart = currentPolyline.coordinates[i];
      const segmentEnd = currentPolyline.coordinates[i + 1];
      
      // Calculate perpendicular distance to segment
      const distance = distanceToSegment(position, segmentStart, segmentEnd);
      if (distance < minDistance) {
        minDistance = distance;
        closestSegmentIndex = i;
      }
    }
    
    console.log(`[REROUTE] Closest route segment: ${closestSegmentIndex}, Distance: ${minDistance.toFixed(2)}m`);
    return minDistance;
  };

  // Calculate distance from point to line segment
  const distanceToSegment = (
    point: Coordinate, 
    segmentStart: Coordinate, 
    segmentEnd: Coordinate
  ): number => {
    const x = point.latitude;
    const y = point.longitude;
    const x1 = segmentStart.latitude;
    const y1 = segmentStart.longitude;
    const x2 = segmentEnd.latitude;
    const y2 = segmentEnd.longitude;
    
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    
    // Convert to meters using haversine
    return haversineDistance(point, { latitude: xx, longitude: yy });
  };

  // Determine which route segment the user is currently in
  const updateCurrentSegment = (position: Coordinate) => {
    // Skip if no route or only one segment
    if (!routePolylines.length || routePolylines.length === 1) return;
    
    // Find closest segment start point
    let minDistance = Infinity;
    let closestSegmentIndex = 0;
    
    for (let i = 0; i < routePolylines.length; i++) {
      const segment = routePolylines[i];
      if (segment.coordinates.length) {
        // Check distance to first point in segment
        const distance = haversineDistance(position, segment.coordinates[0]);
        if (distance < minDistance) {
          minDistance = distance;
          closestSegmentIndex = i;
        }
        
        // Also check distance to last point for segments we might have passed
        const lastPointDistance = haversineDistance(
          position, 
          segment.coordinates[segment.coordinates.length - 1]
        );
        if (lastPointDistance < minDistance) {
          minDistance = lastPointDistance;
          closestSegmentIndex = i + 1;
          // Don't exceed the number of segments
          if (closestSegmentIndex >= routePolylines.length) {
            closestSegmentIndex = routePolylines.length - 1;
          }
        }
      }
    }
    
    // Update current segment if changed
    if (closestSegmentIndex !== currentSegmentIndexRef.current) {
      currentSegmentIndexRef.current = closestSegmentIndex;
      setCurrentSegmentIndex(closestSegmentIndex);
    }
  };

  const handleReroute = async () => {
    // Prevent multiple simultaneous reroutes
    if (reroutingInProgressRef.current) {
      console.log("[REROUTE] Skipping reroute - another reroute already in progress");
      return;
    }
    
    console.log("[REROUTE] Starting reroute process...");
    reroutingInProgressRef.current = true;
    
    try {
      if (!userLocation) {
        console.log("[REROUTE] Cannot reroute: user location not available");
        Alert.alert("Cannot Reroute", "Your current location is not available.");
        reroutingInProgressRef.current = false;
        return;
      }
      
      // Get current position and remaining stops
      const currentPosition = userLocation;
      console.log(`[REROUTE] Current position: lat=${currentPosition.latitude}, lng=${currentPosition.longitude}`);
      
      // Find the next stop that hasn't been visited yet
      let nextUnvisitedStopIndex = nextStopIndexRef.current;
      console.log(`[REROUTE] Next unvisited stop index: ${nextUnvisitedStopIndex}, total stops: ${stops.length}`);
      
      // If all stops are visited or we're off track without any remaining stops, end the journey
      if (nextUnvisitedStopIndex >= stops.length) {
        console.log("[REROUTE] All stops already visited, ending journey");
        Alert.alert("Journey Complete", "You have reached all stops in your journey.");
        if (!journeyEndedRef.current) {
          journeyEndedRef.current = true;
          finishJourney();
        }
        reroutingInProgressRef.current = false;
        return;
      }
      
      // Gather remaining stops and their transport modes
      const remainingStops = stops.slice(nextUnvisitedStopIndex);
      console.log(`[REROUTE] Remaining stops: ${remainingStops.length}`);
      remainingStops.forEach((stop, i) => {
        console.log(`[REROUTE] Stop ${i}: lat=${stop.latitude}, lng=${stop.longitude}, name=${stop.name}`);
      });
      
      // Create new points array starting with current location
      const points: [number, number][] = [
        [currentPosition.longitude, currentPosition.latitude],
        ...remainingStops.map((stop) => [stop.longitude, stop.latitude]),
      ];
      
      // Get transport modes for remaining segments
      const segmentModes = remainingStops
        .map((_, index) => {
          const originalIndex = nextUnvisitedStopIndex + index;
          const mode = uiToApiMapping[selectedModes[originalIndex - 1]] || DEFAULT_MODE;
          console.log(`[REROUTE] Segment ${index} mode: ${mode}`);
          return mode;
        });
      
      console.log(`[REROUTE] API request - points: ${JSON.stringify(points)}, modes: ${JSON.stringify(segmentModes)}`);
      setIsLoadingRoute(true);
      
      // Call API to get new route
      const response = await apiRoute.getMultiStopNavigationRoute(points, segmentModes);
      
      if (response.ok && response.data) {
        console.log("[REROUTE] Route API response successful");
        setRouteData(response.data);
        setEstimatedTime(response.data.total_time || null);
        
        if (response.data.segments && Array.isArray(response.data.segments)) {
          console.log(`[REROUTE] Received ${response.data.segments.length} segments`);
          
          const newPolylines: {
            mode: string;
            coordinates: { latitude: number; longitude: number }[];
          }[] = [];
          
          const allWaypoints: Array<{
            mode: string;
            coordinate: { latitude: number; longitude: number };
          }> = [];
          
          // Extract the new route data
          response.data.segments.forEach((segment: any, i: number) => {
            const segMode = segment.mode || "unknown";
            console.log(`[REROUTE] Processing segment ${i}, mode: ${segMode}`);
            
            // Extract bus route information if present
            if (segMode === "bus" && segment.paths) {
              segment.paths.forEach((path: any) => {
                if (path.instructions && Array.isArray(path.instructions)) {
                  const boardingInstruction = path.instructions.find((instr: any) => 
                    instr.text && instr.text.startsWith("Board bus route")
                  );
                  if (boardingInstruction) {
                    console.log(`[REROUTE] Found bus instruction: ${boardingInstruction.text}`);
                    const routeMatch = boardingInstruction.text.match(/Board bus route ([^\s]+)/);
                    if (routeMatch) {
                      const fullRouteId = routeMatch[1];
                      const parts = fullRouteId.split('-');
                      if (parts.length >= 2) {
                        const busNumber = parts[1];
                        console.log(`[REROUTE] Set bus route: ${busNumber}`);
                        setBusRouteInfo({
                          routeNumber: busNumber,
                          boardingStop: "Bus Stop",
                          destinationStop: "Final Stop"
                        });
                      }
                    }
                  }
                }
              });
            }
            
            if (segment.points && Array.isArray(segment.points)) {
              console.log(`[REROUTE] Segment ${i} has ${segment.points.length} points`);
              const coords = segment.points.map((pt: [number, number]) => ({
                latitude: pt[1],
                longitude: pt[0],
              }));
              newPolylines.push({ mode: segMode, coordinates: coords });
              coords.forEach((coord: { latitude: number; longitude: number }) => {
                allWaypoints.push({ mode: segMode, coordinate: coord });
              });
            } else {
              console.log(`[REROUTE] Segment ${i} has no direct points`);
            }
            
            if (segment.paths && Array.isArray(segment.paths)) {
              console.log(`[REROUTE] Segment ${i} has ${segment.paths.length} paths`);
              segment.paths.forEach((path: any, pathIndex: number) => {
                if (path.points && Array.isArray(path.points)) {
                  console.log(`[REROUTE] Path ${pathIndex} in segment ${i} has ${path.points.length} points`);
                  const pathCoords = path.points.map((pt: [number, number]) => ({
                    latitude: pt[1],
                    longitude: pt[0],
                  }));
                  newPolylines.push({ mode: path.mode || segMode, coordinates: pathCoords });
                  pathCoords.forEach((coord: { latitude: number; longitude: number }) => {
                    allWaypoints.push({ mode: path.mode || segMode, coordinate: coord });
                  });
                } else {
                  console.log(`[REROUTE] Path ${pathIndex} in segment ${i} has no points`);
                }
              });
            } else {
              console.log(`[REROUTE] Segment ${i} has no paths`);
            }
          });
          
          console.log(`[REROUTE] Parsed route data: ${newPolylines.length} polylines, ${allWaypoints.length} waypoints`);
          
          // Update route data with new polylines and waypoints
          setRoutePolylines(newPolylines);
          setJourneyWaypoints(allWaypoints);
          totalWaypointsRef.current = allWaypoints.length;
          
          // Reset off-route counters
          offRouteCountRef.current = 0;
          offRouteTimestampRef.current = null;
          
          // Update route ID with server
          try {
            // Prepare waypoints for API
            const apiWaypoints = allWaypoints.map((item) => item.coordinate);
            console.log(`[REROUTE] Updating journey with ${apiWaypoints.length} waypoints`);
            const response = await apiUser.startJourney(apiWaypoints);
            
            if (response.ok && response.data) {
              console.log(`[REROUTE] Updated journey successfully, new routeId: ${response.data.routeId}`);
              const id = String(response.data.routeId);
              setRouteId(id);
              routeIdRef.current = id;
            } else {
              console.error(`[REROUTE] Failed to update journey, response: ${JSON.stringify(response)}`);
            }
          } catch (error) {
            console.error("[REROUTE] Error updating journey after reroute:", error);
          }
          
          // Add rerouting point to journey history
          setJourneyHistory((prev) => {
            return {
              ...prev,
              waypoints: [
                ...prev.waypoints,
                {
                  type: "waypoint",
                  waypoint: currentPosition,
                  timestamp: Date.now(),
                },
              ],
            };
          });
          
          // Notify user
          Alert.alert(
            "Route Updated",
            "Your route has been recalculated from your current location."
          );
        } else {
          console.error("[REROUTE] API response missing segments:", response.data);
        }
      } else {
        console.error(`[REROUTE] Route API Error: ${response.problem}, Status: ${response.status}`);
        console.error(`[REROUTE] Response data: ${JSON.stringify(response.data)}`);
        Alert.alert("Rerouting Failed", "Unable to calculate a new route. Please try again.");
      }
    } catch (error) {
      console.error("[REROUTE] Unhandled error in reroute process:", error);
      Alert.alert("Error", "Failed to recalculate route.");
    } finally {
      console.log("[REROUTE] Reroute process completed");
      setIsLoadingRoute(false);
      reroutingInProgressRef.current = false;
    }
  };

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
            onUserCameraChange={(isControlled, zoom, pitch) => {
              setUserControlledCamera(isControlled);
              setUserZoomLevel(zoom);
              setUserPitch(pitch);
            }}
          />
        </>
      )}
      <Animated.View style={[themed($bottomAnimatedContainer), { height: bottomHeightAnim }]}>
        {collapsed ? (
          <View style={themed($collapsedContent)}>
            <LegendComponent />
            <View style={themed($routeInfoContainer)}>
              {estimatedTime && (
                <View style={themed($timeContainer)}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.textDim} />
                  <Text style={themed($estimatedTimeText)}>
                    Est {Math.round(estimatedTime / 60000)} min
                  </Text>
                </View>
              )}
              {totalDistanceRef.current > 0 && (
                <View style={themed($timeContainer)}>
                  <MaterialCommunityIcons name="map-marker-distance" size={14} color={theme.colors.textDim} />
                  <Text style={themed($estimatedTimeText)}>
                    {(totalDistanceRef.current / 1000).toFixed(2)} km
                  </Text>
                </View>
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

const $timeContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.xs,
  paddingVertical: 4,
})

const $estimatedTimeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 13,
  marginLeft: 4,
  fontWeight: "500"
})

const $busInfoContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.background,
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
