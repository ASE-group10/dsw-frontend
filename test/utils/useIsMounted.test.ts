// useIsMounted.test.ts

import { renderHook } from "@testing-library/react-hooks"
import { useIsMounted } from "../../app/utils/useIsMounted" // adjust the path as needed

describe("useIsMounted", () => {
  it("returns true when mounted and false after unmount", () => {
    // Render the hook
    const { result, unmount } = renderHook(() => useIsMounted())

    // The returned function should indicate the component is mounted.
    expect(result.current()).toBe(true)

    // Unmount the hook to trigger the cleanup effect.
    unmount()

    // After unmounting, the function should now return false.
    expect(result.current()).toBe(false)
  })
})
