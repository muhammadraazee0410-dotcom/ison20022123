FROM node:18-alpine as build
WORKDIR /app
# Use correct backend URL for this project
ENV REACT_APP_BACKEND_URL=https://ison20022123-production.up.railway.app
COPY frontend/package.json ./ 
RUN npm install --legacy-peer-deps
COPY frontend/ .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]