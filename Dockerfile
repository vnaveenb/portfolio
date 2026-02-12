FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Run as non-root user (Security Best Practice)
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "index.js"]
