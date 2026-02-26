# Stage 1: Build
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build-time environment variables
ARG REACT_APP_GOOGLE_CLIENT_ID=""
ARG REACT_APP_BACKEND_URL=""
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# Configure Nginx for SPA (React Router)
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
