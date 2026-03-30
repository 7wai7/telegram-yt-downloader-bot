FROM node:20-slim

# install dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-venv \
    python3-pip \
    && python3 -m venv /venv \
    && /venv/bin/pip install yt-dlp \
    && apt-get clean

ENV PATH="/venv/bin:$PATH" /
    YTDLP_JS_RUNTIME=node

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

CMD ["node", "dist/main.js"]