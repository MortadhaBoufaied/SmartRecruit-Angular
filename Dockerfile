FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
ENV API_GATEWAY_HOST=api-gateway:8080
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/smartrecruit/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
