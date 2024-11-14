# Use Node.js as the base image
FROM node

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Expose the port for Next.js
EXPOSE 3000

# Start the Next.js application in development mode
CMD ["npm", "run", "dev"]