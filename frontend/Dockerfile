FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ]; then \
      npm install --no-save lightningcss-linux-arm64-gnu; \
    else \
      npm install --no-save lightningcss-linux-x64-gnu; \
    fi
COPY . .
RUN EXPO_PUBLIC_API_URL=https://rentoz.online npx expo export --platform web

FROM nginx:alpine AS run
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
