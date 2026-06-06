FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG VITE_API_URL=https://api.vstepgo.com/api/v1
ARG VITE_GOOGLE_CLIENT_ID=644444548899-q6kldv6576f2gjoccrm3i3s9sqlbetce.apps.googleusercontent.com
ARG VITE_MOBILE_APK_URL=https://github.com/nghyane/VSTEP/releases/latest/download/VstepGO.apk
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_MOBILE_APK_URL=$VITE_MOBILE_APK_URL
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
