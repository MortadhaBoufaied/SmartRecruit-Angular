# SmartRecruit Angular frontend

Angular 18 frontend for SmartRecruit. It uses the Spring API Gateway for identity, recruitment, candidate CV/AI, notifications, subscriptions and analytics APIs. Job and interview screens remain connected to their gateway routes while those backend services are being completed.

## Run

```bash
npm install
npm start
```

Open `http://localhost:4200`. The Angular dev server proxies `/api` requests to `http://localhost:8080`.

For the Nginx container, set `API_GATEWAY_HOST` to the gateway host and port on the same Docker network. It defaults to `api-gateway:8080`.

## Main routes

- `/jobs` public job search
- `/login` registration and authentication
- `/dashboard`, `/profile`, `/cvs`, `/applications`, `/notifications`
- `/recruiter`, `/interviews`, `/subscriptions`, `/analytics`, `/admin`

## Integrated service areas

Identity and profile management, recruiter approval, job search and applications, private CV upload/download and ATS scanning, notifications, subscription lifecycle and billing history, recruiter analytics, and PDF reports call backend APIs. ATS scanning uses the backend's local deterministic analyzer; payments use its mock provider until real external providers are configured.
