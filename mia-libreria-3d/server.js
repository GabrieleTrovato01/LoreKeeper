import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { EPub } from 'epub2';
import axios from 'axios';
import { askBookRAG } from './rag-service.js'; // Importiamo il nostro nuovo Bibliotecario

const app = express();
const port = 3000;

// Configurazione cartelle
const uploadDir = 'uploads/';
const publicDir = path.join(process.cwd(), 'public');
const coversDir = path.join(publicDir, 'covers');
const booksJsonPath = path.join(publicDir, 'books.json');
const delay = ms => new Promise(res => setTimeout(res, ms));

// Creiamo le cartelle se non esistono
if (!fsSync.existsSync(uploadDir)) fsSync.mkdirSync(uploadDir);
if (!fsSync.existsSync(coversDir)) fsSync.mkdirSync(coversDir, { recursive: true });

const upload = multer({ dest: uploadDir });

app.use(express.json());
app.use(express.static('public'));

// --- FUNZIONI HELPER ---

// 1. Estrae dati dall'EPUB. ORA ACCETTA ANCHE IL NOME DEL FILE ORIGINALE.
async function parseEpub(filePath, coverFileName, originalFileName) {
    try {
        const epub = await EPub.createAsync(filePath);
        
        let extractedTitle = epub.metadata.title;
        let extractedAuthor = epub.metadata.creator;

        // PIANO B: Se mancano i metadati, usiamo il nome del file pulito!
        if (!extractedTitle || extractedTitle.trim() === '') {
            console.log(`⚠️ Metadati mancanti! Uso il nome del file come esca per Google...`);
            extractedTitle = originalFileName.replace(/\.epub$/i, '').replace(/[_-]/g, ' ').trim();
            extractedAuthor = ''; 
        }

        const metadata = {
            title: extractedTitle,
            author: extractedAuthor || 'Autore Sconosciuto',
            description: epub.metadata.description ? epub.metadata.description.replace(/<[^>]*>?/gm, '').trim() : null,
            coverPath: null
        };

        const coverId = epub.metadata.cover;
        if (coverId) {
            try {
                const [imgData, mimeType] = await epub.getImageAsync(coverId);
                if (imgData) {
                    const extension = mimeType === 'image/png' ? '.png' : '.jpg';
                    const finalCoverName = `${coverFileName}${extension}`;
                    const fullCoverPath = path.join(coversDir, finalCoverName);
                    
                    await fs.writeFile(fullCoverPath, imgData);
                    metadata.coverPath = `covers/${finalCoverName}`; 
                }
            } catch (imgError) {
                console.error("⚠️ Impossibile estrarre l'immagine dall'EPUB:", imgError.message);
            }
        }
        return metadata;
    } catch (error) {
        throw new Error(`Errore di parsing EPUB: ${error.message}`);
    }
}

// 2. Ricerca su Google Books (Sistema a Punteggio sui primi 10 risultati con Retry)
async function fetchGoogleBooksData(title, author) {
    let result = {
        description: "Trama non trovata su Google Books.",
        coverUrl: null,
        pageCount: 350,
        googleTitle: null,
        googleAuthor: null,
        categories: []
    };

    try {
        const searchTitle = title === 'Titolo Sconosciuto' ? '' : title;
        const searchAuthor = author === 'Autore Sconosciuto' ? '' : author;
        
        const cleanQuery = `${searchTitle} ${searchAuthor}`.replace(/[_-]/g, ' ').trim();
        
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&langRestrict=it&printType=books&maxResults=10&key=AIzaSyDf-vxdHbYaoJJ0s65sR-9l_aIWoV2qgqA`;
        
        console.log(`🌐 Sto contattando Google con questo URL: ${url}`);

        // --- SISTEMA DI RETRY (Fino a 3 tentativi) ---
        let response = null;
        let isSuccess = false;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                response = await axios.get(url, { timeout: 8000 });
                isSuccess = true;
                break; // Se ha successo, interrompe immediatamente il ciclo
            } catch (error) {
                // Se è un errore 503 e non siamo all'ultimo tentativo
                if (error.response && error.response.status === 503 && attempt < 3) {
                    console.log(`   ⚠️ Google limitato (503). Tentativo ${attempt}/3 fallito. Riprovo tra 3 secondi...`);
                    await delay(3000); // Pausa di 3 secondi
                } else {
                    // Altrimenti (es. nessun internet, timeout o fine tentativi), lancia l'errore al catch esterno
                    throw error;
                }
            }
        }
        // ----------------------------------------------

        if (isSuccess && response && response.data.items && response.data.items.length > 0) {
            let bestVolume = null;
            let highestScore = -1;

            const queryWords = cleanQuery.toLowerCase().split(' ').filter(w => w.length > 3);

            for (let item of response.data.items) {
                const volumeInfo = item.volumeInfo;
                const itemTitle = (volumeInfo.title || '').toLowerCase();
                const itemAuthors = (volumeInfo.authors || []).join(' ').toLowerCase();
                const fullText = `${itemTitle} ${itemAuthors}`;

                let score = 0;

                for (let word of queryWords) {
                    if (fullText.includes(word)) score++;
                }

                if (volumeInfo.description) score += 0.5;

                if (score > highestScore) {
                    highestScore = score;
                    bestVolume = volumeInfo;
                }
            }

            if (!bestVolume) {
                bestVolume = response.data.items[0].volumeInfo;
            }

            if (bestVolume.description) {
                result.description = bestVolume.description.replace(/<[^>]*>?/gm, ''); 
            }
            if (bestVolume.imageLinks && bestVolume.imageLinks.thumbnail) {
                result.coverUrl = bestVolume.imageLinks.thumbnail.replace('http:', 'https:').replace('&zoom=1', '&zoom=0');
            }
            if (bestVolume.pageCount) result.pageCount = bestVolume.pageCount;
            if (bestVolume.title) result.googleTitle = bestVolume.title;
            if (bestVolume.authors && bestVolume.authors.length > 0) result.googleAuthor = bestVolume.authors.join(', ');
        }
    } catch (error) {
        console.error("❌ Errore con l'API di Google Books:", error.message);
    }

    return result;
}

// 3. Scarica l'immagine da internet
async function downloadCoverImage(url, fileName) {
    try {
        const response = await axios({ 
            url, 
            method: 'GET', 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/jpeg, image/png, image/*'
            },
            timeout: 8000
        });
        
        const finalCoverName = `${fileName}_google.jpg`; 
        const fullCoverPath = path.join(coversDir, finalCoverName);
        
        await fs.writeFile(fullCoverPath, response.data);
        return `covers/${finalCoverName}`; 
    } catch (error) {
        console.error("⚠️ Errore nel download della copertina da Google Books:", error.message);
        return null;
    }
}

// --- API UPLOAD ---
app.post('/api/upload', upload.single('ebook'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ success: false, message: 'Nessun file caricato.' });

        console.log(`\n📥 Inizio elaborazione di: ${file.originalname}...`);

        const timestamp = Date.now();
        const baseName = `book_${timestamp}`;

        console.log(`⚙️  Estrazione metadati e copertina interna...`);
        const epubData = await parseEpub(file.path, baseName, file.originalname);

        let currentBooks = [];
        try {
            const fileData = await fs.readFile(booksJsonPath, 'utf-8');
            currentBooks = JSON.parse(fileData);
        } catch (e) {}

        const isDuplicate = currentBooks.some(book => 
            book.title.toLowerCase().trim() === epubData.title.toLowerCase().trim() && 
            book.author.toLowerCase().trim() === epubData.author.toLowerCase().trim()
        );

        if (isDuplicate) {
            console.log(`🛑 Upload bloccato: "${epubData.title}" è già presente in libreria.`);
            try { await fs.unlink(file.path); } catch (err) {}
            return res.json({ success: false, message: 'Questo libro è già presente nel tuo scaffale!' });
        }

        console.log(`✔️  Dati iniziali: "${epubData.title}" di ${epubData.author}`);
        
        console.log(`⏳ Attesa iniziale di 2 secondi per non sovraccaricare le API di Google...`);
        await delay(2000);
        
        console.log(`🔍 Ricerca dati su Google Books...`);
        const googleData = await fetchGoogleBooksData(epubData.title, epubData.author);

        let finalTitle = epubData.title;
        let finalAuthor = epubData.author;

        if (googleData.googleTitle) {
            const titleWords = epubData.title.toLowerCase().split(' ').filter(w => w.length > 3);
            const googleTitleLower = googleData.googleTitle.toLowerCase();
            const isRelated = titleWords.some(word => googleTitleLower.includes(word));

            if (isRelated || epubData.title === 'Titolo Sconosciuto') {
                finalTitle = googleData.googleTitle;
                finalAuthor = googleData.googleAuthor || epubData.author;
                console.log(`✨ Autocorrezione: Titolo corretto in "${finalTitle}"`);
            }
        }

        let finalCoverPath = epubData.coverPath; 
        if (!finalCoverPath && googleData.coverUrl) {
            console.log(`🖼️  Copertina assente nell'EPUB. Download in corso da Google Books...`);
            finalCoverPath = await downloadCoverImage(googleData.coverUrl, baseName);
        }

        let finalDescription = "Nessuna trama disponibile per questo libro.";
        let epubDesc = epubData.description;

        if (epubDesc) epubDesc = epubDesc.replace(/^(EDGT[0-9]+[\r\n\s]*)/i, '').trim();

        if (epubDesc && epubDesc.length > 30) {
            console.log(`📖 Trama valida trovata all'interno dell'EPUB!`);
            finalDescription = epubDesc;
        } else if (googleData.description && googleData.description !== "Trama non trovata su Google Books.") {
            console.log(`🌐 Trama EPUB assente o non valida. Trama scaricata da Google Books.`);
            finalDescription = googleData.description;
        }

        const ebooksDir = path.join(publicDir, 'ebooks');
        if (!fsSync.existsSync(ebooksDir)) fsSync.mkdirSync(ebooksDir, { recursive: true });
        
        const finalEpubPath = `ebooks/${baseName}.epub`;
        await fs.rename(file.path, path.join(publicDir, finalEpubPath));

        const newBook = {
            id: baseName,
            title: finalTitle,
            author: finalAuthor,
            description: finalDescription, 
            coverPath: finalCoverPath,
            pageCount: googleData.pageCount || 350,
            epubPath: finalEpubPath,
            tags: []
        };

        console.log(`📝 Aggiornamento della libreria...`);
        currentBooks.push(newBook);
        await fs.writeFile(booksJsonPath, JSON.stringify(currentBooks, null, 4));

        try { await fs.unlink(file.path); } catch (unlinkError) {}

        console.log(`✅ Successo! "${newBook.title}" aggiunto allo scaffale.\n`);
        res.json({ success: true, message: 'Libro elaborato e aggiunto con successo!' });

    } catch (error) {
        console.error("❌ Errore critico durante l'elaborazione del libro:", error);
        res.status(500).json({ success: false, message: 'Errore interno del server.' });
    }
});

// --- ROTTA PER LA CHAT RAG CON IA LOCALE ---
app.post('/api/chat', async (req, res) => {
    // Ora ci aspettiamo anche epubUrl e currentSnippet dal frontend
    const { question, currentSnippet, epubUrl } = req.body; 

    if (!question || !epubUrl) {
        return res.status(400).json({ success: false, message: 'Dati mancanti (domanda o url del libro)' });
    }

    try {
        // TRUCCO DEL PERCORSO: Trasforma l'URL relativo in percorso fisico
        const decodedUrl = decodeURI(epubUrl); 
        
        // Rimuove lo slash iniziale se presente, per un path.join sicuro
        const cleanUrl = decodedUrl.replace(/^\//, ''); 
        
        // Collega la cartella 'public' al nome del file (es: public/ebooks/book_123.epub)
        const physicalEpubPath = path.join(publicDir, cleanUrl);

        console.log(`\n==================================================`);
        console.log(`📍 L'utente è qui: "${(currentSnippet || "").substring(0, 60)}..."`);
        console.log(`==================================================\n`);

        // Lanciamo la ricerca e generazione RAG!
        const answer = await askBookRAG(physicalEpubPath, question, currentSnippet || "");
        
        res.json({ success: true, answer: answer });

    } catch (error) {
        console.error("Errore nella chat AI (RAG):", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Errore durante la consultazione del libro o la comunicazione con Ollama." 
        });
    }
});

// --- ROTTA PER AGGIUNGERE TAG PERSONALIZZATI ---
app.post('/api/books/:id/tags', async (req, res) => {
    const bookId = req.params.id;
    const { tag } = req.body;

    if (!tag || tag.trim() === '') {
        return res.status(400).json({ success: false, message: 'Tag non valido.' });
    }

    try {
        const fileData = await fs.readFile(booksJsonPath, 'utf-8');
        let books = JSON.parse(fileData);
        const bookIndex = books.findIndex(b => b.id === bookId);

        if (bookIndex === -1) return res.status(404).json({ success: false, message: 'Libro non trovato.' });

        // Inizializza l'array se non esiste
        if (!books[bookIndex].tags) books[bookIndex].tags = [];

        const cleanTag = tag.trim();
        // Aggiungiamo il tag in cima, così diventa la categoria "Principale" per la mensola
        const tagExists = books[bookIndex].tags.some(t => t.toLowerCase() === cleanTag.toLowerCase());
        
        if (!tagExists) {
            books[bookIndex].tags.unshift(cleanTag); // unshift lo mette al primo posto
            await fs.writeFile(booksJsonPath, JSON.stringify(books, null, 4));
            return res.json({ success: true, message: 'Tag aggiunto!' });
        } else {
            return res.json({ success: true, message: 'Tag già presente.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Errore interno del server.' });
    }
});

// --- ROTTA PER GESTIRE LE CATEGORIE IN BLOCCO (Rinomina/Elimina) ---
app.put('/api/categories', async (req, res) => {
    const { oldName, newName, action } = req.body;

    try {
        const fileData = await fs.readFile(booksJsonPath, 'utf-8');
        let books = JSON.parse(fileData);
        let updatedCount = 0;

        books.forEach(book => {
            // Se il libro ha tag e il primo tag corrisponde alla categoria che stiamo modificando
            if (book.tags && book.tags.length > 0 && book.tags[0] === oldName) {
                if (action === 'rename' && newName) {
                    book.tags[0] = newName.trim();
                    updatedCount++;
                } else if (action === 'delete') {
                    book.tags = []; // Resettiamo i tag: il libro tornerà "Senza Categoria"
                    updatedCount++;
                }
            }
        });

        if (updatedCount > 0) {
            await fs.writeFile(booksJsonPath, JSON.stringify(books, null, 4));
            res.json({ success: true, message: `Categoria aggiornata con successo su ${updatedCount} libri.` });
        } else {
            res.json({ success: false, message: 'Nessun libro trovato per questa categoria.' });
        }
    } catch (error) {
        console.error("Errore nella gestione categorie:", error);
        res.status(500).json({ success: false, message: 'Errore interno del server.' });
    }
});

// --- ROTTA PER SPOSTARE PIU' LIBRI INSIEME (BULK) ---
app.put('/api/books/bulk-tags', async (req, res) => {
    const { bookIds, newTag } = req.body;

    try {
        const fileData = await fs.readFile(booksJsonPath, 'utf-8');
        let books = JSON.parse(fileData);
        let updatedCount = 0;

        books.forEach(book => {
            if (bookIds.includes(book.id)) {
                if (!book.tags) book.tags = [];
                // Rimuoviamo il tag se per caso ce l'aveva già in seconda posizione
                book.tags = book.tags.filter(t => t.toLowerCase() !== newTag.toLowerCase());
                // Inseriamo la nuova categoria in prima posizione
                book.tags.unshift(newTag.trim());
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            await fs.writeFile(booksJsonPath, JSON.stringify(books, null, 4));
            res.json({ success: true, message: `Spostati ${updatedCount} libri.` });
        } else {
            res.json({ success: false, message: 'Nessun libro aggiornato.' });
        }
    } catch (error) {
        console.error("Errore nell'aggiornamento massivo:", error);
        res.status(500).json({ success: false, message: 'Errore interno del server.' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Backend in ascolto su http://localhost:${port}`);
});