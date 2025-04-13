// test/utils/TestWrapper.tsx
import React from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"

export const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider>{children}</SafeAreaProvider>
)
