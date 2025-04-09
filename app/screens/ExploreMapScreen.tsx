import { FC, useEffect, useRef, useState } from "react"
import {
  View,
  ViewStyle,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  FlatList,
  Animated,
  Easing,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import Geolocation from "@react-native-community/geolocation"
import Constants from "expo-constants"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
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
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [routeId, setRouteId] = useState<string | null>(null)
  const [followsUser, setFollowsUser] = useState<boolean>(true)
  const [nextStopIndex, setNextStopIndex] = useState<number>(1)
  const [journeyStarted, setJourneyStarted] = useState<boolean>(false)
  const [selectedModes, setSelectedModes] = useState<{ [index: number]: string }>({})
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false)
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
  const journeyWatchId = useRef<number | null>(null)
  const lastWaypointRef = useRef<Coordinate | null>(null)
  const totalWaypointsRef = useRef(0)
  const journeyEndedRef = useRef(false)
  const journeyWaypointsRef = useRef(journeyWaypoints)
  const journeyHistoryRef = useRef(journeyHistory)
  const offRouteCountRef = useRef(0)
  const offRouteTimestampRef = useRef<number | null>(null)

  // ----- Animation -----
  const expandedHeight = height * 0.4
  const collapsedHeight = 140
  const bottomHeightAnim = useRef(new Animated.Value(expandedHeight)).current

  // ---------------------- EFFECTS ---------------------- //
  useEffect(() => {
    journeyWaypointsRef.current = journeyWaypoints
  }, [journeyWaypoints])
  useEffect(() => {
    journeyHistoryRef.current = journeyHistory
    // console.log("Journey History updated:", JSON.stringify(journeyHistory, null, 2))
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

  useEffect(() => {
    const updateLocationOnMount = async () => {
      try {
        await getUserLocation()
      } catch (error) {
        console.error("Error getting current position on mount:", error)
      }
    }
    updateLocationOnMount()
      .then(() => {
        // console.log("Location update completed")
      })
      .catch((error) => {
        console.error("Error in updateLocationOnMount:", error)
      })
  }, [])

  // ---------------------- HELPER FUNCTIONS ---------------------- //

  const getUserLocation = async () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, heading } = position.coords
          setUserLocation({ latitude, longitude })
          // console.log("Updated user location:", { latitude, longitude, heading })
          resolve({ latitude, longitude, heading })
        },
        (error) => {
          console.error("Error getting current position:", error)
          reject(error)
        },
        { enableHighAccuracy: true },
      )
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
        // Determine the number of manual stops already added.
        // If the first stop is "Current Location", subtract 1.
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

      // Update the selected mode for the newly added stop.
      // The new stop’s index is at the end of the newStops array.
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

  // 8) Remove stop
  const removeStop = (index: number) => {
    setRoutePolylines([])
    setStops((prev) => prev.filter((_, i) => i !== index))
    setSelectedModes((prev) => {
      const updated = { ...prev }
      delete updated[index]
      return updated
    })
  }

  // 9) Select mode for a stop
  const handleSelectMode = (index: number, mode: string) => {
    setSelectedModes((prev) => ({
      ...prev,
      [index]: mode,
    }))
  }

  const stopHit = (stopIndex: number) => {
    // console.log(`User reached stop number ${stopIndex + 1}`)
    setJourneyHistory((prev): JourneyHistory => {
      const alreadyHit = prev.waypoints.find(
        (item) =>
          item.type === "stop" &&
          item.waypoint.latitude === stops[stopIndex].latitude &&
          item.waypoint.longitude === stops[stopIndex].longitude,
      )

      if (alreadyHit) {
        // console.log("Stop already recorded:", stops[stopIndex].name)
        return prev
      }

      const newStop: JourneyHistoryItem = {
        type: "stop",
        stopName: stops[stopIndex].name,
        waypoint: { latitude: stops[stopIndex].latitude, longitude: stops[stopIndex].longitude },
        timestamp: Date.now(),
      }

      // console.log("Recording new stop:", stops[stopIndex].name)

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

      // console.log("About to call getMultiStopNavigationRoute...", points, segmentModes)
      const response = await apiRoute.getMultiStopNavigationRoute(points, segmentModes)

      if (response.ok && response.data) {
        console.log("Route data:", response.data)
        setRouteData(response.data)
        // Alert.alert("Success", "Route calculated successfully!")

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
            if (segment.points && Array.isArray(segment.points)) {
              const coords = segment.points.map((pt: [number, number]) => ({
                latitude: pt[1],
                longitude: pt[0],
              }))
              newPolylines.push({ mode: segMode, coordinates: coords })
              // Flatten coordinates to journey waypoints
              coords.forEach((coord: Coordinate) => {
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
                  pathCoords.forEach((coord: Coordinate) => {
                    allWaypoints.push({ mode: path.mode || segMode, coordinate: coord })
                  })
                }
              })
            }
          })

          setRoutePolylines(newPolylines)
          setJourneyWaypoints(allWaypoints)
          totalWaypointsRef.current = allWaypoints.length
          // console.log("allWaypoints:", allWaypoints)
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

  // Helper: Haversine distance calculation
  const haversineDistance = (coords1: Coordinate, coords2: Coordinate) => {
    const toRad = (x: number) => (x * Math.PI) / 180
    const R = 6371000 // Earth's radius in meters
    const lat1 = toRad(coords1.latitude)
    const lat2 = toRad(coords2.latitude)
    const deltaLat = toRad(coords2.latitude - coords1.latitude)
    const deltaLon = toRad(coords2.longitude - coords1.longitude)
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const trackJourneyProgress = () => {
    if (journeyWatchId.current !== null) {
      Geolocation.clearWatch(journeyWatchId.current)
      journeyWatchId.current = null
    }

    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords

        // Distance calculation and update
        if (prevLocation.current) {
          const distance = haversineDistance(prevLocation.current, { latitude, longitude })

          totalDistanceRef.current += distance

          // console.log(`Prev position:`, prevLocation.current)
          // console.log(`Real-time position: ${latitude}, ${longitude}`)
          // console.log(`Distance between points: ${distance.toFixed(2)} m`)
          // console.log(`Total Distance Travelled: ${totalDistanceRef.current.toFixed(2)} m`)
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

        // // ---- Off-Route Detection Logic ----
        // // If we have a last passed waypoint (A) and a pending waypoint (B)
        // if (lastWaypointRef.current && journeyWaypointsRef.current.length > 0) {
        //   const thresholdForWaypoint = modeThreshold(journeyWaypointsRef.current[0].mode)
        //   const waypointA = lastWaypointRef.current
        //   const waypointB = journeyWaypointsRef.current[0].coordinate
        //   const distanceFromCurrentToA = haversineDistance({ latitude, longitude }, waypointA)
        //   const distanceFromAtoB = haversineDistance(waypointA, waypointB) + thresholdForWaypoint
        //
        //   console.log(
        //     `Distance from current location to A (lat: ${waypointA.latitude}, lon: ${waypointA.longitude}): ${distanceFromCurrentToA}m, ` +
        //       `Distance from A to B (A: lat: ${waypointA.latitude}, lon: ${waypointA.longitude} vs B: lat: ${waypointB.latitude}, lon: ${waypointB.longitude}): ${distanceFromAtoB}m`,
        //   )
        //   if (distanceFromCurrentToA > distanceFromAtoB) {
        //     offRouteCountRef.current += 1
        //     if (!offRouteTimestampRef.current) {
        //       offRouteTimestampRef.current = Date.now()
        //     }
        //     const elapsed = Date.now() - offRouteTimestampRef.current
        //     // Define thresholds: 3 consecutive checks OR 10 seconds
        //     const OFF_ROUTE_COUNT_THRESHOLD = 0
        //     const OFF_ROUTE_TIME_THRESHOLD_MS = 3000
        //
        //     if (
        //       offRouteCountRef.current >= OFF_ROUTE_COUNT_THRESHOLD ||
        //       elapsed >= OFF_ROUTE_TIME_THRESHOLD_MS
        //     ) {
        //       console.warn("User is off route consistently, triggering reroute...")
        //       reroute()
        //       return;
        //     }
        //   } else {
        //     // Reset counter and timestamp if condition is no longer met.
        //     offRouteCountRef.current = 0
        //     offRouteTimestampRef.current = null
        //   }
        // }

        // Check if the user is near the next pending waypoint (if any)
        if (journeyWaypointsRef.current && journeyWaypointsRef.current.length > 0) {
          const nextWaypoint = journeyWaypointsRef.current[0]
          if (nextWaypoint && nextWaypoint.coordinate) {
            const distanceToNext = haversineDistance(
              { latitude, longitude },
              nextWaypoint.coordinate,
            )
            const thresholdForWaypoint = modeThreshold(nextWaypoint.mode)
            if (distanceToNext <= thresholdForWaypoint) {
              // console.log("Passed waypoint:", nextWaypoint)
              addWaypointToHistory(nextWaypoint.coordinate)
              lastWaypointRef.current = nextWaypoint.coordinate
              setJourneyWaypoints((prev) => prev.slice(1))
            }
          }
        }

        const startingStopIndex = 1
        // Use the ref's current value to check the next stop
        if (
          nextStopIndexRef.current >= startingStopIndex &&
          nextStopIndexRef.current < stops.length
        ) {
          const nextStop = stops[nextStopIndexRef.current]
          const distanceToStop = haversineDistance(
            { latitude, longitude },
            { latitude: nextStop.latitude, longitude: nextStop.longitude },
          )
          // Use the journeyHistoryRef to check if the stop is already recorded
          const alreadyHit = journeyHistoryRef.current.waypoints.find(
            (item) =>
              item.type === "stop" &&
              item.waypoint.latitude === nextStop.latitude &&
              item.waypoint.longitude === nextStop.longitude,
          )
          const previousIndex = nextStopIndexRef.current - 1
          const modeForStop = selectedModes[previousIndex] || DEFAULT_MODE
          const thresholdForStop = modeThreshold(modeForStop)

          // console.log(
          //   `Checking next stop: ${nextStop.name} at index ${nextStopIndexRef.current} with mode ${modeForStop}`,
          // )
          // console.log(`Distance to next stop: ${distanceToStop}`)
          // console.log(`Already hit: ${alreadyHit ? "Yes" : "No"}`)

          if (!alreadyHit && distanceToStop <= thresholdForStop) {
            // console.log(`Reached stop: ${nextStop.name} at index ${nextStopIndexRef.current}`)
            stopHit(nextStopIndexRef.current)
            // Update both the state and the ref when incrementing the stop index
            setNextStopIndex((prev) => {
              const newIndex = prev + 1
              nextStopIndexRef.current = newIndex
              return newIndex
            })
            // console.log("Updated journey history after hitting stop:", journeyHistory)
          } else if (alreadyHit) {
            // console.log(`Skipping stop: ${nextStop.name}, reason: Already recorded`)
            setNextStopIndex((prev) => {
              const newIndex = prev + 1
              nextStopIndexRef.current = newIndex
              return newIndex
            })
          } else {
            // console.log(`Skipping stop: ${nextStop.name}, reason: Not close enough`)
          }
        }

        // ---- Auto-trigger end-of-journey check ----
        // If all stops have been processed and at least 80% of waypoints have been passed.
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
            // console.log("Auto-trigger: conditions met for finishing journey.")
            finishJourney()
          }
        }
      },
      (error) => console.error("Error watching position:", error),
      {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 1000,
        fastestInterval: 500,
      },
    )
    journeyWatchId.current = watchId
  }

  // Add waypoint to history only if it hasn't been added before
  const addWaypointToHistory = (waypoint: Coordinate) => {
    setJourneyHistory((prev): JourneyHistory => {
      const alreadyExists = prev.waypoints.find(
        (item) => item.type === "waypoint" && coordinatesAreEqual(item.waypoint, waypoint),
      )

      if (alreadyExists) {
        // console.log("Waypoint already in history:", waypoint)
        return prev
      }

      const newWaypoint: JourneyHistoryItem = {
        type: "waypoint",
        waypoint,
        timestamp: Date.now(),
      }

      // console.log("Adding new waypoint to history:", waypoint)

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
      // console.log("Start Journey button clicked")
      if (journeyWaypoints.length === 0) {
        Alert.alert("No Route", "Please calculate a route before starting the journey.")
        return
      }

      // Prepare waypoints for API call
      const waypoints = journeyWaypoints.map((item) => item.coordinate)

      try {
        // Call the start journey API
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
      trackJourneyProgress()
    } else {
      // console.log("End Journey button clicked")
      if (!journeyEndedRef.current) {
        journeyEndedRef.current = true
        finishJourney()
      }
    }
  }

  const reroute = () => {
    // console.log("Reroute triggered: User went off route.")

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
    // Compute the summary details.
    const stopsFinished = journeyHistoryRef.current.waypoints.filter(
      (item) => item.type === "stop",
    ).length
    const totalStops = stops.length

    const totalDistanceFromApi =
      routeData && routeData.total_distance ? routeData.total_distance : totalDistanceRef.current

    const travelledDistance = totalDistanceRef.current // distance tracked via geolocation.
    const totalWaypoints = totalWaypointsRef.current || 0
    const travelledWaypointsCount = totalWaypoints - (journeyWaypointsRef.current?.length || 0)

    // Extract modes of transport from polyline segments.
    // If routePolylines is empty or contains only one mode, fallback to the user-requested modes.
    const modesOfTransport =
      routePolylines.length > 0 &&
      Array.from(new Set(routePolylines.map((poly) => poly.mode))).length > 1
        ? Array.from(new Set(routePolylines.map((poly) => poly.mode)))
        : stops.slice(1).map((_, index) => uiToApiMapping[selectedModes[index]] || DEFAULT_MODE)

    // console.log("Route Data:", routeData)
    // console.log("Route Polylines:", routePolylines)

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

    // Reset journey data and UI.
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
    // console.log("Journey finished and summary posted.")
  }

  const resetJourneyData = () => {
    // console.log("Resetting journey data...")

    // Clear the position watcher.
    if (journeyWatchId.current !== null) {
      Geolocation.clearWatch(journeyWatchId.current)
      journeyWatchId.current = null
    }

    // Get the latest current location.
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords
        setUserLocation({ latitude, longitude })
        // console.log("Reset to current location:", { latitude, longitude, heading })
      },
      (error) => {
        // console.error("Error getting current position on reset:", error)
      },
      { enableHighAccuracy: true },
    )

    // Reset all journey-related state and refs.
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

    // Reset additional refs for a fresh start.
    journeyEndedRef.current = false
    setNextStopIndex(1)
    nextStopIndexRef.current = 1

    // console.log("Journey data cleared.")
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
        <MapViewComponent
          userLocation={userLocation}
          mapRef={mapRef}
          followsUser={followsUser}
          handleMapLongPress={handleMapLongPress}
          stops={stops}
          routePolylines={routePolylines}
        />
      )}
      <Animated.View style={[themed($bottomAnimatedContainer), { height: bottomHeightAnim }]}>
        {collapsed ? (
          <View style={themed($collapsedContent)}>
            <LegendComponent />
            <View style={themed($controlButtonsRow)}>
              <TouchableOpacity
                style={[
                  themed($startButton),
                  {
                    // Use theme.colors.error when journey is active,
                    // otherwise use theme.colors.tint
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

const $bottomAnimatedContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  overflow: "hidden",
  backgroundColor: colors.background, // Using background to mimic a card
  borderTopLeftRadius: spacing.sm,
  borderTopRightRadius: spacing.sm,
  elevation: 5,
})

const $bottomSectionContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.sm,
})

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

// Additional themed styles for collapsed section

const $collapsedContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: spacing.sm,
})

const $controlButtonsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  flexDirection: "row",
  justifyContent: "center",
  marginTop: spacing.md,
})

const $startButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  // Background color will be set conditionally in render (error/tint)
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
  // Use the theme’s white—here we derive it from the palette:
  color: colors.palette.neutral100,
  fontSize: 16,
  fontWeight: "600",
  marginRight: spacing.sm,
})

const $expandButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  alignItems: "center",
  backgroundColor: colors.border, // Using border color for button background
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
