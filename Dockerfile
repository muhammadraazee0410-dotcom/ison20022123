FROM node:18-alpine as build
WORKDIR /app
# Force use of legacy peer deps to handle react-day-picker conflicts
COPY frontend/package.json ./ 
RUN npm install --legacy-peer-deps
COPY frontend/ .
RUN npm run build

RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]