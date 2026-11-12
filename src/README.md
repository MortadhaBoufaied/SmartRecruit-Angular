# SmartRecruit Angular src

All browser calls use the relative `/api/v1` base URL. `npm start` configures the Angular dev-server proxy in `src/proxy.conf.json` to forward `/api` to `http://localhost:8080`. The production Nginx image forwards `/api/` to `API_GATEWAY_HOST` (default `api-gateway:8080`).

Coverage: Identity, Recruitment, Candidate CV/AI, Notifications, Interviews, Subscriptions and Analytics. Admin and recruiter APIs use the backend route contracts; Recruitment and Interview service completion remains with their service owners.
