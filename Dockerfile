FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies and build
RUN cd backend && npm install
RUN cd frontend && npm install
RUN cd frontend && npm run build
RUN cd backend && npx prisma generate && npm run build

# Expose port
EXPOSE 4000
ENV PORT=4000
ENV NODE_ENV=production

# Start: push schema + run server
CMD sh -c "cd backend && npx prisma db push --accept-data-loss && node dist/server.js"
