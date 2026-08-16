# Use a lightweight, stable version of Node.js
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port our app runs on
EXPOSE 8000

# Start the server
CMD ["node", "server.js"]