import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { TextStyle, ViewStyle, ScrollView, TextInput } from "react-native"
import { Button, Screen, Text, TextField } from "../components"
import { AppStackScreenProps } from "../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "../utils/useAppTheme"
import { api } from "../services/api"

interface ApiTestScreenProps extends AppStackScreenProps<"ApiTest"> {}

export const ApiTestScreen: FC<ApiTestScreenProps> = observer(function ApiTestScreen(_props) {
  const [endpoint, setEndpoint] = useState<string>("/test")
  const [response, setResponse] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const callApi = async () => {
    setIsLoading(true)
    setResponse("")
    try {
      const result = await api.get(endpoint) // Replace with your actual API call logic
      setResponse(JSON.stringify(result.data, null, 2))
    } catch (error: any) {
      setResponse(
        error.response?.data?.message || "An error occurred. Please check the endpoint or try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <ScrollView>
        <Text tx="apiTestScreen:heading" preset="heading" style={themed($heading)} />
        <Text tx="apiTestScreen:description" preset="subheading" style={themed($description)} />

        <TextField
          value={endpoint}
          onChangeText={setEndpoint}
          containerStyle={themed($textField)}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          label="apiTestScreen:endpointLabel"
          placeholder="apiTestScreen:endpointPlaceholder"
        />

        <Button
          tx={isLoading ? "apiTestScreen:loading" : "apiTestScreen:callApi"}
          style={themed($callApiButton)}
          preset="reversed"
          onPress={callApi}
          disabled={isLoading}
        />

        <Text tx="apiTestScreen:response" preset="subheading" style={themed($responseTitle)} />
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
