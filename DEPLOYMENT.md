# Deployment Guide 🚀

This application is ready to be deployed. Because it uses **local file storage** for credentials (`server/tokens.json`), it is best suited for a **VPS** (Virtual Private Server) like DigitalOcean, Linode, or AWS EC2, rather than ephemeral platforms like Heroku/Vercel (unless you add database storage).

## Prerequisites

1.  **A Domain Name** (e.g., `dashboard.yourname.com`).
2.  **A VPS** (Ubuntu 22.04 LTS recommended) with at least 1GB RAM.
3.  **SSH Access** to your VPS.

## 1. Prepare Your Codebase

We have already updated the code to support production environments. You just need to set the environment variables.

### Client Config
Create a `.env` file in the `client/` directory for production build (or set these in your CI/CD):
```env
VITE_API_URL=https://api.dashboard.yourname.com
```

### Server Config
Create a `.env` file in the `server/` directory on your VPS:
```env
NODE_ENV=production
DISABLE_SSL=true
PORT=3001
CLIENT_URL=https://dashboard.yourname.com
SERVER_URL=https://api.dashboard.yourname.com
# Plus your existing keys (TWITCH_CLIENT_ID, etc.)
```

> **Note:** `DISABLE_SSL=true` tells the Node server to run on HTTP (Port 3001) so that **Nginx** can handle the SSL (HTTPS) termination and proxy requests to it.

---

## 2. Server Setup (Step-by-Step)

### A. Install Dependencies
SSH into your VPS and run:
```bash
sudo apt update
sudo apt install nodejs npm nginx certbot python3-certbot-nginx
# Install PM2 to keep app running
sudo npm install -g pm2
```

### B. Clone & Install
```bash
git clone https://github.com/yourusername/multi-stream-dashboard.git
cd multi-stream-dashboard

# Setup Server
cd server
npm install
# ... (Create your .env file here with your real keys!) ...

# Setup Client
cd ../client
npm install
npm run build
```

### C. Run the Backend
We use PM2 to keep the server running in the background.
```bash
cd ../server
pm2 start index.js --name "stream-hub-api"
pm2 save
pm2 startup
```
*The backend is now running on localhost:3001 inside the VPS.*

### D. Server the Frontend & Configure Nginx
We will use Nginx to serve the `client/dist` (static files) AND proxy API requests to the backend.

Edit Nginx config:
`sudo nano /etc/nginx/sites-available/stream-hub`

```nginx
server {
    server_name dashboard.yourname.com;

    # Serve React Frontend
    location / {
        root /path/to/multi-stream-dashboard/client/dist;
        try_files $uri /index.html;
    }

    # Proxy API & Websocket to Node Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
    
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/stream-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### E. Enable SSL (HTTPS)
Use Certbot to get a free Let's Encrypt certificate:
```bash
sudo certbot --nginx -d dashboard.yourname.com
```

---

## 3. Update OAuth Callbacks

Go to your Twitch, Kick, and Google Developer consoles and add your **new production Redirect URIs**:

*   **Twitch**: `https://dashboard.yourname.com/api/auth/twitch/callback`
*   **Kick**: `https://dashboard.yourname.com/api/auth/kick/callback`
*   **YouTube**: `https://dashboard.yourname.com/api/auth/youtube/callback`

**Important**: If you used a separate subdomain for the API (like `api.dashboard...`), use that domain for the callbacks. The Nginx config above assumes everything is on ONE domain (`dashboard...`) which is simpler.

---

## 4. Done!
Visit `https://dashboard.yourname.com` and log in!
