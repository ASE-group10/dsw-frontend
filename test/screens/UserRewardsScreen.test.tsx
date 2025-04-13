import React from "react"
import { render } from "@testing-library/react-native"
import { UserRewardsScreen } from "../../app/screens/UserRewardsScreen"
import { TestWrapper } from "../utils/TestWrapper"

describe("UserRewardsScreen", () => {
  it("should render correctly", () => {
    const { getByText } = render(
      <TestWrapper>
        <UserRewardsScreen />
      </TestWrapper>
    )
    expect(getByText("Rewards")).toBeTruthy()
  })
})
