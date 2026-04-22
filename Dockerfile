FROM node:18-alpine as build
WORKDIR /app
COPY frontend/package.json ./ 
RUN npm install
COPY frontend/ .
RUN npm run build

# Using serve to host the static files on port 3000
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]