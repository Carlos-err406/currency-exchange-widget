# Implementation Plan

- [x] 1. Extract reusable components from app.tsx
  - Extract CurrencyImage component with zoom functionality and image loading logic
  - Extract DollarSignButton component with toggle and drag functionality
  - Refactor app.tsx to use the extracted components
  - Ensure existing widget mode functionality remains unchanged
  - _Requirements: 2.1, 2.2_

- [x] 2. Create popup-specific React component
  - Create TrayPopup component that uses the extracted CurrencyImage component
  - Implement popup-specific layout without the dollar sign button
  - Handle popup-specific styling and sizing for popup context
  - Ensure image loading and zoom functionality works in popup context
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 2.1. Create image interaction context provider
  - Create ImageInteractionContext to manage scale and origin state
  - Implement ImageInteractionProvider with scale, origin, and click handler logic
  - Export useImageInteraction hook for consuming components
  - Refactor App.tsx to use the context provider instead of local state
  - Refactor TrayPopup.tsx to use the context provider instead of local state
  - _Requirements: 2.1, 2.2_

- [x] 3. Create popup window functionality
  - Add createPopupWindow function to window.ts for popup creation
  - Configure popup window properties (frameless, always-on-top, transparent, skipTaskbar)
  - Implement popup positioning logic to appear near tray icon
  - Add screen boundary detection to keep popup fully visible
  - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

- [ ] 4. Implement popup lifecycle management
  - Create TrayPopupWindow class to handle show/hide functionality
  - Implement auto-hide behavior when popup loses focus
  - Add timer-based auto-hide with configurable delay
  - Handle popup cleanup and memory management
  - _Requirements: 1.2, 1.3, 4.3_

- [ ] 5. Update tray click handler
  - Modify existing tray.ts to create and show popup instead of main window
  - Implement tray click logic to toggle popup visibility
  - Handle popup positioning relative to tray icon bounds
  - Update context menu to reflect new popup behavior
  - _Requirements: 1.1, 1.4_

- [ ] 6. Integrate popup with main application
  - Update main.ts to handle popup window creation in tray mode
  - Load TrayPopup component in popup window context
  - Ensure proper cleanup when application exits
  - Add IPC handlers for popup-specific functionality if needed
  - _Requirements: 1.1, 1.2, 2.2, 2.4_

- [ ]\* 7. Add error handling and testing
  - Handle popup creation failures gracefully
  - Add fallback behavior when tray positioning fails
  - Add basic error logging for debugging popup issues
  - Test popup functionality across different screen configurations
  - _Requirements: 2.3_
