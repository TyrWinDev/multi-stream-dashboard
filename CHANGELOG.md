# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-12-14

### Added
- **Unified Chat Reply**: Added reply button, mention syntax, and reply context banner.
- **Mention Highlighting**: Messages mentioning the user are now highlighted yellow with bold/italic text.
- **UI Polish**:
  - **Brand Colors**: Platform buttons in Chat and Stream Manager now use brand-specific colors (Purple/Green/Red).
  - **Dynamic Update Button**: "Update" button text adapts to selected platforms (e.g., "Update Twitch & Kick").
- **Event Animations**: Added Confetti explosions and sliding Alert Banners for Follows, Subs, and Tips.
- **Alert Controls**: Added a "Enable Event Alerts" toggle in Settings to globally mute animations.
- **Kick Metadata**: Implemented automated Category search (by name) and channel updates (Title & Category) using Kick Public API v1.
- **Twitch Auth**: Fixed issue where bot connected anonymously; now fetches username before joining.

### Changed
- **Stream Manager**: Integrated directly into the main layout (right column footer). Replaced floating `MetadataPanel`.
- **Status Bar**: Fixed footer bar for global controls (Simulation, Connections) and copyright info.
- **Settings & Debug**: Refactored to be controlled modals managed by `App.jsx`, removing floating toggle buttons.
- **Stream Metadata Manager**: A new floating panel (bottom-left) allows users to update stream titles, game categories (Twitch), and update multiple platforms simultaneously (Twitch, YouTube).
- **Disconnect Functionality**: Users can now disconnect/logout from Twitch, Kick, YouTube, and TikTok directly from the Settings Panel.
- **YouTube Integration**: Full OAuth 2.0 flow, chat pooling, and connection status for YouTube Live.
- **Click-Outside-To-Close**: Settings and Metadata panels now close when clicking outside their area.
- **"CONNECT" Prompt**: Settings buttons now explicitly prompt to "CONNECT" when offline, and "DISCONNECT" (on hover) when linked.

### Fixed
- **Settings Panel Z-Index**: Fixed issue where the Close button was unclickable due to incorrect z-index layering.
- **TikTok Input Overflow**: Constrained the TikTok username input field to prevent the "Connect" button from pushing out of the container.
- **Disconnect Button State**: Fixed an issue where the disconnect action was nested inside a disabled button, effectively blocking the click.
- **Modal Close Logic**: Replaced text-based 'X' with a proper icon and improved hit area.

### Changed
- **TikTok Auth**: Migrated to a redirect-based flow (`/api/auth/tiktok`) to resolve connection issues.
- **Poll Rate**: Reduced TikTok chat polling interval to 500ms for near-real-time performance.
