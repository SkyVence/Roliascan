# Bare Metal Deployment

This document describes the steps and considerations for deploying the backend service directly onto a virtual machine or physical server (Bare Metal).

## Prerequisites

*   A server (Linux recommended, e.g., Ubuntu, CentOS) with root or sudo access.
*   Node.js and npm (or pnpm/yarn) installed on the server.
*   A PostgreSQL database accessible from the server (can be on the same server or external).
*   A process manager like `pm2` or `systemd` to keep the application running.
*   (Recommended) A reverse proxy like Nginx or Apache to handle HTTPS, load balancing (if needed), and serving static files.

## Deployment Steps

1.  **Prepare the Server:**
    *   Ensure Node.js (version compatible with the project, e.g., 18 or 20) and npm/pnpm are installed.
    *   Install necessary build tools if not present (`build-essential` on Debian/Ubuntu).
    *   Install `pm2` globally: `npm install pm2 -g` (or `pnpm add -g pm2`).
    *   Install and configure Nginx/Apache.
    *   Set up the PostgreSQL database and user.

2.  **Get the Code:**
    *   Clone the repository onto the server: `git clone <your-repo-url>`
    *   Navigate to the project directory: `cd roliascan-turborepo`

3.  **Install Dependencies & Build:**
    *   Install dependencies for the entire workspace (needed for build steps):
        ```bash
        npm install
        # or pnpm install
        ```
    *   Build the backend application:
        ```bash
        npm run build --workspace=backend
        # or pnpm --filter backend build
        ```
    *   *(Optional Pruning)* For a cleaner deployment, you might consider copying only the necessary files (`apps/backend/dist`, `apps/backend/node_modules`, `apps/backend/package.json`, root `node_modules` if needed) to a separate deployment directory.

4.  **Configure Environment:**
    *   Create an `.env` file inside the `apps/backend` directory.
    *   Add the required environment variables, ensuring `DATABASE_URL` points to your prepared PostgreSQL database and `NODE_ENV` is set to `production`.
        ```env
        # apps/backend/.env
        NODE_ENV=production
        PORT=3000 # Or another port if desired
        HOST=0.0.0.0
        JWT_SECRET=generate_a_very_strong_secret_here
        DATABASE_URL=postgresql://db_user:db_password@localhost:5432/roliascan_prod
        UPLOAD_DIR=uploads # Relative path from backend root
        MAX_FILE_SIZE=10485760
        UPLOAD_METHOD=server
        ```
    *   Ensure the `UPLOAD_DIR` directory exists and has the correct write permissions for the user running the Node.js application.
        ```bash
        mkdir -p apps/backend/uploads
        # chown/chmod might be needed depending on user setup
        ```

5.  **Start the Application with PM2:**
    *   Navigate to the `apps/backend` directory: `cd apps/backend`
    *   Start the application using pm2. Replace `dist/index.js` if your entry point is different.
        ```bash
        pm2 start dist/index.js --name roliascan-backend
        ```
    *   **Check Status:** `pm2 status` or `pm2 logs roliascan-backend`
    *   **Save Process List:** `pm2 save` (to ensure pm2 restarts the app after server reboot, requires initial `pm2 startup` setup).

6.  **Configure Reverse Proxy (Nginx Example):**
    *   Create an Nginx server block configuration (e.g., in `/etc/nginx/sites-available/roliascan`):
        ```nginx
        server {
            listen 80;
            server_name your_domain.com; # Or server IP address

            # Redirect http to https (if using SSL)
            # listen 443 ssl;
            # ssl_certificate /path/to/your/fullchain.pem;
            # ssl_certificate_key /path/to/your/privkey.pem;
            # include /etc/letsencrypt/options-ssl-nginx.conf; 
            # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
            # if ($scheme != "https") {
            #     return 301 https://$host$request_uri;
            # }

            # Location for API requests
            location / {
                proxy_pass http://localhost:3000; # Assuming backend runs on port 3000
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            # Location for serving uploaded files (if UPLOAD_METHOD=server)
            location /uploads/ {
                alias /path/to/roliascan-turborepo/apps/backend/uploads/;
                try_files $uri $uri/ =404;
                # Add caching headers if desired
                # expires 1M;
                # add_header Cache-Control "public";
            }

            # Access and error logs
            access_log /var/log/nginx/roliascan.access.log;
            error_log /var/log/nginx/roliascan.error.log;
        }
        ```
    *   Enable the site: `sudo ln -s /etc/nginx/sites-available/roliascan /etc/nginx/sites-enabled/`
    *   Test Nginx configuration: `sudo nginx -t`
    *   Reload Nginx: `sudo systemctl reload nginx`
    *   (Optional) Set up SSL using Let's Encrypt: `sudo certbot --nginx -d your_domain.com`

## Updates

1.  Navigate to the project directory: `cd /path/to/roliascan-turborepo`
2.  Pull the latest changes: `git pull`
3.  Install/update dependencies: `npm install` (or `pnpm install`)
4.  Rebuild the application: `npm run build --workspace=backend` (or `pnpm --filter backend build`)
5.  Restart the application using pm2: `pm2 restart roliascan-backend`

## Notes

*   Ensure firewall rules allow traffic on the necessary ports (e.g., 80, 443 for Nginx, 3000 if accessed directly).
*   Monitor the application using `pm2 monit` and check logs (`pm2 logs`).
*   Regularly back up the database and uploaded files (if stored locally). 