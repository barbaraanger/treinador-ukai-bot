FROM node:22-bookworm-slim

WORKDIR /app

# @discordjs/opus may compile native bindings when a matching prebuilt binary is unavailable.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

CMD ["npm", "start"]
