import React from "react"
import { render } from "@testing-library/react-native"
import { UserProfileScreen } from "../../app/screens/UserProfileScreen"
import { TestWrapper } from "../utils/TestWrapper"

describe("UserProfileScreen", () => {
  it("should render correctly", () => {
    const { getByText } = render(
      <TestWrapper>
        <UserProfileScreen />
      </TestWrapper>
    )
    expect(getByText("User Profile")).toBeTruthy()
  })
})
