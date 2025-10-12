# Design Document

## Overview

This design implements a tray popup window that displays the currency exchange rates image (without the dollar sign button) when the tray icon is clicked. The solution creates a separate popup window that shows only the image content, providing users with quick access to currency rates without the need for the toggle button since the tray click itself serves as the show/hide mechanism.

## Architecture

### Current System

- **Main Window**: Displays widget content in widget mode, hidden in tray mode
- **Tray**: System tray icon with context menu and click handler
- **IPC System**: Handles communication between main and renderer processes
- **Window Management**: Handles resizing, positioning, and dragging

### New Components

- **Tray Popup Window**: A frameless, always-on-top window that displays only the currency rates image
- **Popup Manager**: Manages popup lifecycle, positioning, and auto-hide behavior
- **Enhanced Tray Handler**: Updated tray click logic to show/hide popup instead of main window
- **Popup-Specific Component**: A simplified version that shows only the image content without the dollar sign button

## Components and Interfaces

### 1. Tray Popup Window (`TrayPopupWindow`)

```typescript
interface TrayPopupConfig {
  width: number;
  height: number;
  alwaysOnTop: boolean;
  frame: boolean;
  skipTaskbar: boolean;
  resizable: boolean;
  transparent: boolean;
}

class TrayPopupWindow {
  private window: BrowserWindow | null;
  private hideTimer: NodeJS.Timeout | null;

  create(config: TrayPopupConfig): BrowserWindow;
  show(trayBounds: Rectangle): void;
  hide(): void;
  isVisible(): boolean;
  scheduleAutoHide(delay: number): void;
  cancelAutoHide(): void;
}
```

### 2. Popup Positioning System

```typescript
interface TrayBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PopupPosition {
  x: number;
  y: number;
}

function calculatePopupPosition(
  trayBounds: TrayBounds,
  popupSize: { width: number; height: number },
  screenBounds: Rectangle
): PopupPosition;
```

### 3. Enhanced Tray Manager

```typescript
interface TrayManager {
  tray: Tray;
  popup: TrayPopupWindow;

  handleTrayClick(): void;
  handleTrayRightClick(): void;
  setupEventListeners(): void;
}
```

### 4. Popup Widget Component

A new simplified React component that displays only the currency rates image without the dollar sign button. This component will:

- Show the daily currency exchange rates image
- Support click-to-zoom functionality on the image
- Handle image loading and error states
- Not include the dollar sign toggle button (tray click serves as the toggle)

## Data Models

### Popup State Management

```typescript
interface PopupState {
  isVisible: boolean;
  position: { x: number; y: number };
  autoHideScheduled: boolean;
}

interface TrayState {
  bounds: Rectangle;
  isAvailable: boolean;
}
```

### Window Configuration

```typescript
interface WindowConfig {
  main: BrowserWindowConstructorOptions;
  popup: BrowserWindowConstructorOptions;
}
```

## Error Handling

### 1. Tray Unavailable

- **Scenario**: System tray is not available on the platform
- **Handling**: Gracefully fallback to showing main window, log warning

### 2. Popup Creation Failure

- **Scenario**: Failed to create popup window due to system constraints
- **Handling**: Show error notification, fallback to main window behavior

### 3. Positioning Errors

- **Scenario**: Cannot determine tray position or screen bounds
- **Handling**: Use default center positioning, ensure popup stays on screen

### 4. Focus Management Issues

- **Scenario**: Popup doesn't auto-hide when losing focus
- **Handling**: Implement backup timer-based hiding, manual click-outside detection

## Testing Strategy

### Unit Tests

- Popup positioning calculations with various screen configurations
- Auto-hide timer management (schedule, cancel, trigger)
- Tray bounds detection and validation
- Window configuration generation

### Integration Tests

- Tray click behavior in different system configurations
- Popup window lifecycle (create, show, hide, destroy)
- Focus management and auto-hide behavior
- Cross-platform tray positioning

### Manual Testing Scenarios

- **Multi-monitor setups**: Verify popup appears on correct screen
- **Different tray positions**: Test with tray at top, bottom, left, right
- **Edge cases**: Tray near screen edges, very small screens
- **Focus behavior**: Click outside popup, switch applications, hover behavior
- **Performance**: Rapid clicking, multiple show/hide cycles

## Implementation Approach

### Phase 1: Core Popup Window

1. Create `TrayPopupWindow` class with basic show/hide functionality
2. Implement popup positioning logic for bottom tray (most common)
3. Add basic auto-hide on focus loss

### Phase 2: Enhanced Positioning

1. Add support for tray positioning on all screen edges
2. Implement multi-monitor awareness
3. Add screen boundary collision detection

### Phase 3: Advanced Behavior

1. Implement hover-to-keep-visible functionality
2. Add smooth show/hide animations
3. Optimize performance for rapid interactions

### Phase 4: Cross-Platform Polish

1. Test and adjust behavior on Windows, macOS, Linux
2. Handle platform-specific tray behavior differences
3. Add platform-specific positioning adjustments

## Technical Considerations

### Performance

- Popup window should be created once and reused (not recreated on each show)
- Minimize renderer process overhead by sharing the same React app
- Use efficient event listeners that don't leak memory

### Platform Compatibility

- Windows: Tray typically at bottom-right
- macOS: Tray at top-right (menu bar)
- Linux: Varies by desktop environment

### Security

- Popup window should have same security restrictions as main window
- No additional permissions or access beyond current widget functionality

### Accessibility

- Popup should be keyboard accessible
- Screen readers should be able to interact with popup content
- High contrast mode support
