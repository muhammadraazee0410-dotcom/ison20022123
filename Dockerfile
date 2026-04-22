FROM node:18-alpine as build
WORKDIR /app
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
# Use the frontend folder specifically to avoid any confusion
COPY frontend/package.json ./ 
RUN npm install
COPY frontend/ .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]