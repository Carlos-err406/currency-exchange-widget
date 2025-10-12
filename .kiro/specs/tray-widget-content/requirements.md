# Requirements Document

## Introduction

This feature completely changes the tray mode behavior to display the same content as widget mode when the tray icon is clicked. Currently, the tray icon only shows/hides the widget (this is deprecated, since now only tray OR widget modes can be enabled at once), but users need access to the currency exchange widget content directly from the tray interaction for a consistent experience across both modes.

## Requirements

### Requirement 1

**User Story:** As a user running the app in tray mode, I want to see the currency exchange image when I click the tray icon, so that I can access the same functionality available in widget mode without switching modes.

#### Acceptance Criteria

1. WHEN the user clicks the tray icon THEN the system SHALL display a popup window containing the currency exchange image
2. WHEN the user clicks outside the popup window THEN the system SHALL automatically hide the popup window
3. WHEN the user clicks the tray icon while the popup is visible THEN the system SHALL hide the popup window

### Requirement 2

**User Story:** As a user, I want the tray popup to have interactive features for the currency rates image, so that I can zoom and navigate the image effectively.

#### Acceptance Criteria

1. WHEN the user clicks on the currency rates image THEN the system SHALL zoom in/out at the clicked position
2. WHEN the image is displayed THEN the system SHALL fetch and display the daily currency exchange rates image
3. WHEN the image fails to load THEN the system SHALL display an appropriate fallback or error state
4. WHEN the popup is shown THEN the system SHALL automatically load and display the current daily rates image

### Requirement 3

**User Story:** As a user, I want the tray popup to appear near the tray icon, so that it feels contextually connected to the tray interaction.

#### Acceptance Criteria

1. WHEN the tray popup is displayed THEN the system SHALL position it near the system tray area
2. WHEN the system tray is at the bottom THEN the popup SHALL appear above the tray icon
3. WHEN the system tray is at the top THEN the popup SHALL appear below the tray icon
4. WHEN the popup would extend beyond screen boundaries THEN the system SHALL adjust the position to remain fully visible

### Requirement 4

**User Story:** As a user, I want the tray popup to have appropriate styling and behavior, so that it feels like a native system popup rather than a full application window.

#### Acceptance Criteria

1. WHEN the tray popup is displayed THEN the system SHALL show it without window decorations (no title bar, borders, or window controls)
2. WHEN the tray popup is displayed THEN the system SHALL make it stay on top of other windows
3. WHEN the tray popup loses focus THEN the system SHALL automatically hide it after a brief delay with a scale down transition
