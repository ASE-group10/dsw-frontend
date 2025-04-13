import React from "react"
import { render } from "@testing-library/react-native"
import { UserRoutesScreen } from "../../app/screens/UserRoutesScreen"
import { TestWrapper } from "../utils/TestWrapper"

describe("UserRoutesScreen", () => {
  it("should render correctly", () => {
    const { getByText } = render(
      <TestWrapper>
        <UserRoutesScreen />
      </TestWrapper>
    )
    expect(getByText("Routes")).toBeTruthy()
  })
})
