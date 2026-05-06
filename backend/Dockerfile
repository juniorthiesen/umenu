FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci

COPY backend ./backend

RUN npm run prisma:generate
RUN npm run build:api

EXPOSE 3333

CMD ["npm", "run", "start:api"]
