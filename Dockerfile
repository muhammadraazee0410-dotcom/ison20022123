FROM node:18-alpine as build
WORKDIR /app
# Explicitly set correct backend URL
ENV REACT_APP_BACKEND_URL=https://ison20022123-production.up.railway.app
# Copy frontend package info specifically
COPY frontend/package.json ./ 
# Use force to ignore any remaining conflicts
RUN npm install --force
# Copy frontend source files specifically
COPY frontend/ .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]