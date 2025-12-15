# Unified Stream Hub 🎥

A robust multi-platform dashboard for live streamers. Monitor chat, activity feeds (follows, subs, gifts), and send messages across **Twitch**, **Kick**, **YouTube**, and **TikTok** from a single interface.

![Dashboard Preview](https://via.placeholder.com/800x450?text=Unified+Stream+Hub+Dashboard)

## Features

-   **Unified Chat**: View and scroll through chat messages from all connected platforms in one feed.
    -   **Contextual Replies**: Click to reply directly to messages (Twitch/Kick/YouTube).
    -   **Mentions**: Highlighted messages when you are tagged.
-   **Stream Manager**:
    -   **Multi-Platform Updates**: Update Title and Game/Category across **Twitch**, **Kick**, and **YouTube** simultaneously.
    -   **Game Search**: Integrated Twitch Category search that auto-maps to other platforms.
-   **OBS Widgets**:
    -   **chat** and **activity** browser sources with full customization.
    -   **Source Customizer**: Visual editor for fonts, colors, animations, and transparency.
    -   **Import Config**: Restore your previous widget settings by pasting the generated URL.
-   **Activity Feed**: Real-time updates for follows, subscriptions, tips, and gifts.
    -   **Event Animations**: Confetti and sliding alerts for high-value events.
-   **Multi-Platform Support**:
    -   **Twitch**: OAuth integration, chat (read/write), subs/follows.
    -   **Kick**: OAuth + PKCE integration, chat (read/write via v1 API), subs/follows.
    -   **YouTube**: OAuth integration, Live Chat (read/write via polling).
    -   **TikTok**: Connect via Username (read-only), optimized for low latency (500ms), supports Gifts/Likes/Chat.
-   **Dynamic Theming**:
    -   **4 Presets**: Default, Cyberpunk (Neon), Soft Dark (Slate), High Contrast.
    -   **Persistence**: Theme preferences are saved locally.
-   **Secure**: Runs on HTTPS with self-signed certificates (development mode).

## Prerequisites

-   **Node.js** (v18 or higher recommended)
-   **npm** or **yarn**
-   Developer accounts for Twitch, Kick, and Google (YouTube) to obtain API credentials.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/multi-stream-dashboard.git
    cd multi-stream-dashboard
    ```

2.  **Install dependencies:**
    This project has two parts: `client` and `server`.

    ```bash
    # Install Server Dependencies
    cd server
    npm install

    # Install Client Dependencies
    cd ../client
    npm install
    ```

## Configuration

1.  **Set up Environment Variables:**
    Create a `.env` file in the `server/` directory based on `.env.example`.

    ```bash
    cp server/.env.example server/.env
    ```

2.  **Fill in your Credentials:**
    Edit `server/.env` and add your keys:

    **Twitch:**
    -   `TWITCH_CLIENT_ID` & `TWITCH_CLIENT_SECRET`: Get from [Twitch Dev Console](https://dev.twitch.tv/console).
    -   Redirect URI: `https://localhost:3001/api/auth/twitch/callback`

    **Kick:**
    -   `KICK_CLIENT_ID` & `KICK_CLIENT_SECRET`: Get from [Kick Developer Portal](https://developers.kick.com/).
    -   Redirect URI: `https://localhost:3001/api/auth/kick/callback`

    **YouTube:**
    -   `YOUTUBE_CLIENT_ID` & `YOUTUBE_CLIENT_SECRET`: Get from [Google Cloud Console](https://console.cloud.google.com/).
    -   Enable **YouTube Data API v3**.
    -   Redirect URI: `https://localhost:3001/api/auth/youtube/callback`

    **TikTok:**
    -   No tokens required. Just your username.

## Running the Application

You need to run both the server and the client.

1.  **Start the Server:**
    ```bash
    cd server
    npm start
    ```
    *Note: The server runs on `https://localhost:3001`.*

2.  **Start the Client:**
    Open a new terminal:
    ```bash
    cd client
    npm run dev
    ```
    *Note: The client runs on `http://localhost:5173`.*

## Usage Guide

1.  **Access the Dashboard:**
    Open your browser to `http://localhost:5173`.

2.  **Connection Manager:**
    -   Click the **Gear Icon** (right side status bar) to open Settings.
    -   Connect/Disconnect platforms and toggle "Event Alerts" logic.
    -   Change **Themes** (Default, Cyberpunk, etc.) instantly.

3.  **Stream Manager:**
    -   Open the bottom-left "Stream Manager" panel.
    -   Select platforms to update (Twitch, Kick, YouTube).
    -   Enter a **Title** and search for a **Game** (uses Twitch directory).
    -   Click **Update** to push changes to all selected platforms.

4.  **OBS Integration:**
    -   Click "Popout Chat" or "Popout Activity" in the dock headers.
    -   Use the **Customizer Modal** to style your overlay (Fonts, Colors, Transparency).
    -   **Copy URL**: Paste this into a Browser Source in OBS.
    -   **Import URL**: Paste an existing Browser Source URL to edit its settings.

5.  **Streaming:**
    -   **Chat**: Type in the input box to send messages to all connected write-supported platforms.
    -   **Reply**: Click the "Reply" arrow on a message to thread your response.

## Troubleshooting

-   **"Failed to fetch" Error**: usually means the browser rejected the self-signed certificate. Visit `https://localhost:3001` to accept it.
-   **TikTok Messages Slow**: We have optimized polling to 500ms. If it feels slow, ensure your server terminal isn't throttled.
-   **YouTube Chat Not Working**: You must be **LIVE** or have an active broadcast for YouTube to create a chat ID. Offline channels return an error.

## Support
If you find this useful, consider buying me a coffee! ☕

[![Ko-fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/tyrwinter)

## License

MIT
