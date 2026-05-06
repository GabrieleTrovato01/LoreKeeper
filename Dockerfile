# 1. Base Node.js aggiornata per supportare Vite
FROM node:22-bookworm-slim

# 2. Installiamo Calibre per la conversione dei PDF
RUN apt-get update && \
    apt-get install -y calibre && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 3. Impostiamo la cartella di lavoro
WORKDIR /app

# 4. Installiamo le dipendenze
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 5. Copiamo tutto il codice
COPY . .

# 6. COMPILIAMO IL FRONTEND CON VITE
RUN npm run build

# 7. Esponiamo la porta 3000
EXPOSE 3000

# 8. Avviamo il server Node.js
CMD ["node", "server.js"]