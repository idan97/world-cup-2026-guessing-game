FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build
# Debug - show what's in dist
RUN ls -laR dist/
# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]