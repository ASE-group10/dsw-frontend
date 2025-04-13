import React from "react"
import { render } from "@testing-library/react-native"
import { ExploreMapScreen } from "../../app/screens/ExploreMapScreen"
import { TestWrapper } from "../utils/TestWrapper"

describe("ExploreMapScreen", () => {
  it("should render correctly", () => {
    const { getByText } = render(
      <TestWrapper>
        <ExploreMapScreen />
      </TestWrapper>
    )
    expect(getByText("Explore Map")).toBeTruthy()
  })
})
