FROM node:18-alpine as build
WORKDIR /app
# Hard-coding backend link to bypass variable errors
ENV REACT_APP_BACKEND_URL=https://ison20022123-production.up.railway.app
# Assuming branch context is already flat
COPY package.json ./ 
RUN npm install --force
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]