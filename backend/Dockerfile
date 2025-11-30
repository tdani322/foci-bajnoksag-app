FROM node:alpine

WORKDIR /app

# Először csak a package fájlokat másoljuk (cache miatt)
COPY package.json ./

# Telepítés
RUN npm install

# Minden mást átmásolunk
COPY . .

# Indítás
CMD ["npm", "run", "start"]