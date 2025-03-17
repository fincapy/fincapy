FROM mcr.microsoft.com/playwright:v1.51.0

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Set the default command
CMD ["npx", "playwright", "test"] 