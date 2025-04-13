import React from "react"
import { render } from "@testing-library/react-native"
import { PreferenceScreen } from "../../app/screens/PreferenceScreen"
import { TestWrapper } from "../utils/TestWrapper"

describe("PreferenceScreen", () => {
  it("should render correctly", () => {
    const { getByText } = render(
      <TestWrapper>
        <PreferenceScreen />
      </TestWrapper>
    )
    expect(getByText("Preferences")).toBeTruthy()
  })
})
