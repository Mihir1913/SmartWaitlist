# Deployment Guide

## Deploying Backend to Render

Prerequisites:
- A GitHub repo containing this project
- A Render account (https://render.com)
- A MongoDB instance (MongoDB Atlas recommended)

Steps:

1. Create a MongoDB Atlas cluster
   - Create a cluster, add a database user, and allow connections (for testing, you can add 0.0.0.0/0 to IP whitelist)
   - Copy the connection string and replace <user>, <password>, and default DB name

2. Push code to GitHub
   ```bash
   git add .
   git commit -m "Prepare backend for Render deployment"
   git push origin main
   ```

3. Create a Web Service in Render
   - In Render, click "New" → "Web Service" → Connect GitHub and pick your repo and branch.
   - Set **Root Directory** to `backend`.
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start`
   - Health check path: `/health`

4. Add environment variables in Render (Service → Environment)
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = secure random string
   - `FRONTEND_URL` = deployed frontend origin (used for CORS/socket origin)
   - `WHATSAPP_PHONE` = (if used)
   - `NODE_ENV` = `production`

5. Deploy and verify
   - Deploy from Render dashboard and open Logs to watch build and start output
   - If needed, use Render's Shell (from the dashboard) to run `npm run seed` to insert initial data

Troubleshooting
- Common causes of failure: invalid `MONGODB_URI`, missing `JWT_SECRET`, TypeScript build errors.
- Check logs in the Render dashboard for stack traces.

Notes
- `render.yaml` is provided at the repo root to configure a Render service automatically.
- Keep secrets out of source control; use Render's Environment settings for secrets.

---

## Deploying Frontend to GitHub Pages

Prerequisites:
- Backend deployed to Render (or another hosting service)
- GitHub repository with GitHub Pages enabled

Steps:

1. Configure GitHub Pages
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Set **Source** to "GitHub Actions"
   - Set **Build and deployment** → "Branch" to `gh-pages` (this will be created automatically)

2. Add API URL secret
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `API_URL`
   - Value: Your deployed backend URL (e.g., `https://smart-waitlist-backend.onrender.com`)
   - Click **Add secret**

3. Update frontend environment file
   - Edit `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

4. Push changes to trigger deployment
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```

5. Access your deployed site
   - Go to **Settings** → **Pages** to see your deployed URL
   - The site will be available at: `https://your-username.github.io/SmartWaitlist/`

Troubleshooting
- **404 errors on refresh**: The `404.html` redirect script handles SPA routing. Ensure it's present in the `public/` folder.
- **API connection errors**: Verify `VITE_API_URL` is set correctly in GitHub secrets and `.env.production`.
- **Base path issues**: Ensure `vite.config.ts` has `base: '/SmartWaitlist'` (no trailing slash).
- **Build failures**: Check the Actions tab in GitHub for detailed error logs.

Notes
- The GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) automatically builds and deploys the frontend.
- The workflow runs on every push to the `main` branch.
- GitHub Pages serves static files only; the backend must be deployed separately.
