# Deploying the backend to Render

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
