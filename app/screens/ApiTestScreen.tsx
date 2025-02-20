import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { TextStyle, ViewStyle, ScrollView, View } from "react-native"
import { Button, Screen, Text, TextField } from "@/components"
import { Picker } from "@react-native-picker/picker"
import { AppStackScreenProps } from "@/navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"
import { api } from "@/services/api"

interface ApiTestScreenProps extends AppStackScreenProps<"ApiTest"> {}

const serviceBaseUrls = {
  environmentalData: "http://10.0.2.2:8081",
  notificationService: "http://10.0.2.2:8082",
  rewardService: "http://10.0.2.2:8083",
  routeCalculation: "http://10.0.2.2:8080",
  userProfile: "http://10.0.2.2:8083",
}

const apis = [
  // Environmental Data Service APIs
  {
    service: "environmentalData",
    method: "GET",
    endpoint: "/environmental-data/coordinates",
    params: null,
    payload: null,
  },
  {
    service: "environmentalData",
    method: "POST",
    endpoint: "/environmental-data/send",
    params: null,
    payload: null,
  },
  {
    service: "environmentalData",
    method: "GET",
    endpoint: "/environmental-data/geojson-data",
    params: null,
    payload: null,
  },
  {
    service: "environmentalData",
    method: "POST",
    endpoint: "/environmental-data/save-geojson",
    params: null,
    payload: null,
  },
  {
    service: "environmentalData",
    method: "GET",
    endpoint: "/environmental-data/hello-env",
    params: null,
    payload: null,
  },

  // Incident Notification Service APIs
  {
    service: "notificationService",
    method: "POST",
    endpoint: "/v1/incidents",
    params: null,
    payload: JSON.stringify({
      incidentType: "SendSMS",
      description: "Incident near user",
    }),
  },

  // Reward Service APIs
  {
    service: "rewardService",
    method: "POST",
    endpoint: "/validate-reward",
    params: null,
    payload: JSON.stringify({
      userId: "{{auth0UserId}}",
      distance: 2.5,
    }),
  },
  {
    service: "rewardService",
    method: "GET",
    endpoint: "/hello-reward",
    params: null,
    payload: null,
  },

  // Route Calculation Service APIs
  {
    service: "routeCalculation",
    method: "POST",
    endpoint: "/route/calculate",
    params: null,
    payload: JSON.stringify({
      userId: "{{auth0UserId}}",
      waypoints: ["Start", "MidPoint", "End"],
    }),
  },
  {
    service: "routeCalculation",
    method: "GET",
    endpoint: "/route/alternative",
    params: null,
    payload: null,
  },
  {
    service: "routeCalculation",
    method: "POST",
    endpoint: "/route/multiTransport",
    params: null,
    payload: JSON.stringify({
      userId: "{{auth0UserId}}",
      waypoints: ["Start", "TrainStation", "BusStop", "End"],
    }),
  },
  {
    service: "routeCalculation",
    method: "GET",
    endpoint: "/route/validateStop",
    params: "?routeId=R123&stopLat=12.34&stopLng=56.78",
    payload: null,
  },

  // User Profile Service APIs
  {
    service: "userProfile",
    method: "POST",
    endpoint: "/api/forgot-password",
    params: null,
    payload: JSON.stringify({
      email: "liowz@tcd.ie",
    }),
  },
  {
    service: "userProfile",
    method: "POST",
    endpoint: "/api/routes/near-incident",
    params: null,
    payload: JSON.stringify({
      auth0UserId: "{{auth0UserId}}",
      radius: 10,
      latitude: 53.3498,
      longitude: -6.2603,
    }),
  },
  {
    service: "userProfile",
    method: "POST",
    endpoint: "/api/users/preferences",
    params: null,
    payload: null,
  },
]

export const ApiTestScreen: FC<ApiTestScreenProps> = observer(function ApiTestScreen(_props) {
  const [selectedApi, setSelectedApi] = useState(apis[0])
  const [params, setParams] = useState<string>(selectedApi.params || "")
  const [payload, setPayload] = useState<string>(selectedApi.payload || "")
  const [response, setResponse] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const {
    authenticationStore: { authToken, authUserId },
  } = useStores()

  const {
    themed,
    theme: { colors: _colors },
  } = useAppTheme()

  const callApi = async () => {
    setIsLoading(true)
    setResponse("")

    try {
      // Set headers
      const headers: { Accept: string; Authorization?: string } = {
        Accept: "application/json",
      }

      // Add Authorization header only if needed
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      // Ensure params are properly handled
      const queryParams = params && params.trim() !== "" ? `?${params}` : ""
      const baseURL = serviceBaseUrls[selectedApi.service as keyof typeof serviceBaseUrls]
      const url = `${baseURL}${selectedApi.endpoint}${queryParams}`

      // Log request details for debugging
      console.log("HTTP Method:", selectedApi.method)
      console.log("Request URL:", url)
      console.log("Request Headers:", headers)
      console.log("Request Params:", params)

      let result
      if (selectedApi.method === "GET") {
        result = await api.get(url, { headers })
      } else if (selectedApi.method === "POST") {
        const parsedPayload = payload
          ? JSON.parse(payload.replace(/{{auth0UserId}}/g, authUserId || "unknown-user"))
          : {}
        console.log("Request Payload:", parsedPayload)
        result = await api.post(url, { parsedPayload, headers })
      } else {
        throw new Error(`Unsupported HTTP method: ${selectedApi.method}`)
      }

      // Display the API response
      setResponse(JSON.stringify(result.data, null, 2))
    } catch (error) {
      console.error("API call failed:", error)
      const typedError = error as any
      setResponse(
        typedError.response?.data ||
          (error as any).message ||
          "An error occurred. Please check the endpoint, payload, or try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleApiChange = (apiIndex: number) => {
    const newApi = apis[apiIndex]
    setSelectedApi(newApi)
    setParams(newApi.params || "")
    setPayload(newApi.payload || "")
    setResponse("")
  }

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <ScrollView>
        <Text tx="apiTestScreen:heading" preset="heading" style={themed($heading)}>
          API Tester
        </Text>
        <Text tx="apiTestScreen:description" preset="subheading" style={themed($description)}>
          Test your APIs with different methods and parameters.
        </Text>

        <View style={themed($baseUrlContainer)}>
          <Text style={themed($baseUrlTitle)}>Service:</Text>
          <Text style={themed($baseUrlText)}>{selectedApi.service}</Text>
        </View>

        <View style={themed($apiSelectionContainer)}>
          <Picker
            selectedValue={selectedApi.endpoint}
            onValueChange={(value: string, index: number) => handleApiChange(index)}
            style={themed($picker)}
          >
            {apis.map((api, index) => (
              <Picker.Item key={index} label={api.endpoint} value={api.endpoint} />
            ))}
          </Picker>
          <Text style={themed($methodText)}>{`Method: ${selectedApi.method}`}</Text>
        </View>

        {selectedApi.method === "GET" ? (
          <TextField
            value={params}
            onChangeText={setParams}
            containerStyle={themed($textField)}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            label="Parameters"
            placeholder="key=value&key2=value2"
          />
        ) : (
          <TextField
            value={payload}
            onChangeText={setPayload}
            containerStyle={themed($textField)}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            multiline
            label="Payload"
            placeholder="Enter POST payload in JSON format"
          />
        )}

        <Button
          tx={isLoading ? "apiTestScreen:loading" : "apiTestScreen:callApi"}
          style={themed($callApiButton)}
          preset="reversed"
          onPress={callApi}
          disabled={isLoading}
        />

        <Text tx="apiTestScreen:response" preset="subheading" style={themed($responseTitle)}>
          API Response
        </Text>
        <Text style={themed($responseText)}>{response || "No response yet."}</Text>
      </ScrollView>
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $heading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $description: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $baseUrlContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
  padding: spacing.sm,
  backgroundColor: "#f0f0f0",
  borderRadius: 5,
})

const $baseUrlTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: "bold",
  color: colors.text,
})

const $baseUrlText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $apiSelectionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $picker: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $methodText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginLeft: spacing.md,
  color: colors.text,
  fontWeight: "bold",
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $callApiButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $responseTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
  marginBottom: spacing.sm,
})

const $responseText: ThemedStyle<TextStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral100,
  padding: 10,
  borderRadius: 5,
  color: colors.text,
  fontFamily: "monospace",
})
