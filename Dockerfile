FROM node:18-alpine as build
WORKDIR /app
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
# Copy package.json from either root or frontend folder
COPY package.json ./ || COPY frontend/package.json ./
RUN npm install
# Copy all files from either root or frontend folder
COPY . . || COPY frontend/ .
RUN npm run build
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]