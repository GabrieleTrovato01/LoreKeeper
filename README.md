# 📚 LoreKeeperAI

*Read this in: [English](#english) | [Italiano](#italiano)*

---

<a name="english"></a>
## 🇬🇧 English

An interactive 3D digital library that allows you to upload, browse, and organize your EPUB files in an immersive graphical environment.

But that's not all: thanks to the integrated **AI Librarian** (based on a 100% local RAG system), you can literally "talk" to your books. Ask questions about the plot, search for specific concepts, or ask for summaries: the Artificial Intelligence will read the book for you and answer, ensuring total privacy for your data and files.

---

### ⚙️ System Requirements (Prerequisites)

To run this project on your computer, you don't need to configure servers or install Node.js. You only need two free programs:

1. **Docker**: The engine that will run the web application (frontend, backend, and vector database) isolated and securely with a single command.
2. **Ollama**: The engine for local Artificial Intelligence (only necessary if you want to use the "Librarian" feature).

---

### 🚀 Installation Guide (Step-by-Step)

#### Step 1: Install Docker
* **Windows / macOS:** Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/). Start it and make sure Docker is running in the background.
* **Linux:** Open the terminal and install Docker Engine and the Compose plugin (e.g., on Ubuntu: `sudo apt install docker.io docker-compose-v2`).

#### Step 2: Prepare the AI's "Brain" (Ollama)
Our Librarian uses local Artificial Intelligence. 

1. Go to [Ollama.com](https://ollama.com/download) and install the program. (If you use Linux: `curl -fsSL https://ollama.com/install.sh | sh`).
2. Make sure Ollama is running.
3. Open the terminal or command prompt and download the two required models:
   
   Download the model to understand and generate text:
   `ollama run gemma4:e2b`
   
   Download the model to read and index books (Vector Database):
   `ollama pull nomic-embed-text`

#### Step 3: Start the 3D Library
Now that the environment is ready, let's start the actual software!

1. Download this project to your PC (via `git clone` or by downloading the ZIP).
2. Open the terminal **exactly inside the project folder** (where the `docker-compose.yml` file is located).
3. Type this command and press Enter:
   `docker-compose up -d --build`

Wait a couple of minutes. Docker will download a lightweight Linux environment, compile the 3D graphics (Vite), and start the server in the background.

---

### 🎮 How to Use the App

Once the terminal has finished loading and is available again, the library is ready!
Open your favorite browser (Chrome, Edge, Safari) and go to the address:

👉 **http://localhost:3000**

**💡 Tip for the ultimate experience:** 
You don't need to open the browser every time! You can transform this page into a desktop app:
On Google Chrome or Edge, go to the menu (the three dots) -> "Save and share" / "Apps" -> **Install page as App / Create shortcut** (remember to check "Open as window"). You will have an icon on your desktop, and it will look just like a native installed program!

---

### 📁 Data Management (Your Books)

The app is smart and syncs data with your computer. Inside the project folder, you will find (or they will be created automatically on the first run) these folders in the `public/` directory:

* `ebooks/`: Your books (EPUBs and converted PDFs) are physically saved here.
* `covers/`: Extracted covers for 3D visualization are saved here.
* `books.json`: This file is the database of your library.

**Note:** These folders are protected and ignored by Git (thanks to `.gitignore`). You can add as many books as you want without risking accidentally uploading them online if you publish the code on GitHub!

---

### 🆘 Troubleshooting

* **The AI Librarian answers: "Zzz... sorry, I was sleeping!"**
  It means the Docker app cannot find Ollama. Make sure you have opened the Ollama program on your physical PC before asking the AI questions. The app uses `host.docker.internal` to communicate securely between the container and your computer.
* **Red error during installation: `CustomEvent is not defined`**
  You are using an outdated version of Node.js in the Dockerfile. Make sure you are using the updated code, where the `Dockerfile` starts with `FROM node:22-bookworm-slim` to support Vite.
* **Terminal error: `port is already allocated`**
  You already have another program running that is using port 3000. Turn it off, or open the `docker-compose.yml` file and change the port from `"3000:3000"` to `"8080:3000"`, then access the app by going to `localhost:8080`.

<br>
<hr>
<br>

<a name="italiano"></a>
## 🇮🇹 Italiano

Una libreria digitale interattiva in 3D che ti permette di caricare, sfogliare e organizzare i tuoi file EPUB e PDF in un ambiente grafico immersivo.

Ma non è finita qui: grazie al **Bibliotecario IA** integrato (basato su un sistema RAG 100% locale), puoi letteralmente "parlare" con i tuoi libri. Fai domande sulla trama, cerca concetti specifici o chiedi riassunti: l'Intelligenza Artificiale leggerà il libro per te e ti risponderà, garantendo la totale privacy dei tuoi dati e dei tuoi file.

---

### ⚙️ Requisiti di Sistema (Prerequisiti)

Per far funzionare questo progetto sul tuo computer non devi configurare server o installare Node.js. Ti servono solo due programmi gratuiti:

1. **Docker**: Il motore che farà girare l'applicazione web (frontend, backend e database vettoriale) in modo isolato e sicuro con un solo comando.
2. **Ollama**: Il motore per l'Intelligenza Artificiale in locale (necessario solo se vuoi usare la funzione del "Bibliotecario").

---

### 🚀 Guida all'Installazione (Passo Passo)

#### Passo 1: Installa Docker
* **Windows / macOS:** Scarica e installa [Docker Desktop](https://www.docker.com/products/docker-desktop/). Avvialo e assicurati che Docker sia attivo in background.
* **Linux:** Apri il terminale e installa Docker Engine e il plugin Compose (es. su Ubuntu: `sudo apt install docker.io docker-compose-v2`).

#### Passo 2: Prepara il "Cervello" dell'IA (Ollama)
Il nostro Bibliotecario usa l'Intelligenza Artificiale locale. 

1. Vai su [Ollama.com](https://ollama.com/download) e installa il programma. (Se usi Linux: `curl -fsSL https://ollama.com/install.sh | sh`).
2. Assicurati che Ollama sia in esecuzione .
3. Apri il terminale o il prompt dei comandi e scarica i due modelli necessari:
   
   Scarica il modello per comprendere e generare testo:
   `ollama run gemma4:e2b`
   
   Scarica il modello per leggere e indicizzare i libri (Vector Database):
   `ollama pull nomic-embed-text`

#### Passo 3: Avvia la Libreria 3D
Ora che l'ambiente è pronto, accendiamo il software vero e proprio!

1. Scarica questo progetto sul tuo PC (tramite `git clone` o scaricando lo ZIP).
2. Apri il terminale **esattamente all'interno della cartella del progetto** (dove si trova il file `docker-compose.yml`).
3. Digita questo comando e premi Invio:
   `docker-compose up -d --build`

Attendi un paio di minuti. Docker scaricherà un ambiente Linux leggerissimo, compilerà la grafica in 3D (Vite) e avvierà il server in background.

---

### 🎮 Come usare l'App

Una volta che il terminale ha finito di caricare ed è tornato disponibile, la libreria è pronta!
Apri il tuo browser preferito (Chrome, Edge, Safari) e vai all'indirizzo:

👉 **http://localhost:3000**

**💡 Tip per l'esperienza definitiva:** 
Non c'è bisogno di aprire il browser ogni volta! Puoi trasformare questa pagina in un'app desktop:
Su Google Chrome o Edge, vai nel menu (i tre puntini) -> "Salva e condividi" / "App" -> **Installa pagina come App / Crea scorciatoia** (ricorda di spuntare "Apri come finestra"). Avrai un'icona sul desktop e sembrerà a tutti gli effetti un programma nativo installato!

---

### 📁 Gestione dei Dati (I tuoi libri)

L'app è intelligente e sincronizza i dati con il tuo computer. All'interno della cartella del progetto, troverai (o verranno create automaticamente al primo avvio) queste cartelle nella directory `public/`:

* `ebooks/`: Qui vengono salvati fisicamente i tuoi libri (EPUB e i PDF convertiti).
* `covers/`: Qui vengono salvate le copertine estratte per la visualizzazione 3D.
* `books.json`: Questo file è il database della tua libreria.

**Nota:** Queste cartelle sono protette e ignorate da Git (grazie al `.gitignore`). Puoi aggiungere quanti libri vuoi senza rischiare di caricarli accidentalmente online se pubblichi il codice su GitHub!

---

### 🆘 Risoluzione dei Problemi Frequenti

* **Il Bibliotecario IA mi risponde: "Zzz... scusami, stavo dormendo!"**
  Significa che l'app Docker non riesce a trovare Ollama. Assicurati di aver aperto il programma Ollama sul tuo PC fisico prima di fare domande all'IA. L'app usa `host.docker.internal` per comunicare in sicurezza tra il container e il tuo computer.
* **Errore in rosso durante l'installazione: `CustomEvent is not defined`**
  Stai usando una versione di Node.js troppo vecchia nel Dockerfile. Assicurati di usare il codice aggiornato, dove il `Dockerfile` inizia con `FROM node:22-bookworm-slim` per supportare Vite.
* **Errore nel terminale: `port is already allocated`**
  Hai già un altro programma in esecuzione che sta usando la porta 3000. Spegnilo, oppure apri il file `docker-compose.yml` e cambia la porta da `"3000:3000"` a `"8080:3000"`, poi accedi all'app andando su `localhost:8080`.