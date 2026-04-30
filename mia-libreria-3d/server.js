import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { EPub } from 'epub2';
import axios from 'axios';

const app = express();
const port = 3000;

// Configurazione cartelle
const uploadDir = 'uploads/';
const publicDir = path.join(process.cwd(), 'public');
const coversDir = path.join(publicDir, 'covers');
const booksJsonPath = path.join(publicDir, 'books.json');

// Creiamo le cartelle se non esistono
if (!fsSync.existsSync(uploadDir)) fsSync.mkdirSync(uploadDir);
if (!fsSync.existsSync(coversDir)) fsSync.mkdirSync(coversDir, { recursive: true });

const upload = multer({ dest: uploadDir });

app.use(express.static('public'));

// --- FUNZIONI HELPER ---

// 1. Estrae dati e copertina dall'EPUB usando epub2
async function parseEpub(filePath, coverFileName) {
    try {
        const epub = await EPub.createAsync(filePath);
        
        const metadata = {
            title: epub.metadata.title || 'Titolo Sconosciuto',
            author: epub.metadata.creator || 'Autore Sconosciuto',
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

// 2. Cerca la trama e il LINK della copertina su Google Books
async function fetchGoogleBooksData(title, author) {
    let result = {
        description: "Trama non trovata su Google Books. È un libro molto misterioso...",
        coverUrl: null
    };

    try {
        const cleanQuery = `${title} ${author}`.replace(/[_-]/g, ' ').trim();
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&langRestrict=it`;
        
        // FIX: Rimosso l'User-Agent. L'API ufficiale preferisce richieste standard e non "mascherate".
        const response = await axios.get(url, {
            timeout: 8000 // Aumentato un po' il tempo di attesa per sicurezza
        });

        if (response.data.items && response.data.items.length > 0) {
            const volumeInfo = response.data.items[0].volumeInfo;
            
            if (volumeInfo.description) {
                result.description = volumeInfo.description.replace(/<[^>]*>?/gm, ''); 
            }
            if (volumeInfo.imageLinks && volumeInfo.imageLinks.thumbnail) {
                result.coverUrl = volumeInfo.imageLinks.thumbnail.replace('http:', 'https:').replace('&zoom=1', '&zoom=0');
            }
        }
    } catch (error) {
        console.error("❌ Errore con l'API di Google Books:", error.message);
    }

    return result;
}

// 3. Scarica l'immagine da internet
async function downloadCoverImage(url, fileName) {
    try {
        // FIX: Qui invece MANTENIAMO l'User-Agent, perché i server delle immagini bloccano Node.js
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

        // 1. Estrazione dall'EPUB
        console.log(`⚙️  Estrazione metadati e copertina interna...`);
        const epubData = await parseEpub(file.path, baseName);
        console.log(`✔️  Trovato: "${epubData.title}" di ${epubData.author}`);

        // 2. Google Books
        console.log(`🔍 Ricerca trama e copertina su Google Books...`);
        const googleData = await fetchGoogleBooksData(epubData.title, epubData.author);

        // 3. IL FALLBACK DELLA COPERTINA
        let finalCoverPath = epubData.coverPath; 

        if (!finalCoverPath && googleData.coverUrl) {
            console.log(`🖼️  Copertina assente nell'EPUB. Download in corso da Google Books...`);
            finalCoverPath = await downloadCoverImage(googleData.coverUrl, baseName);
        } else if (!finalCoverPath && !googleData.coverUrl) {
            console.log(`⚠️  Copertina non trovata né nell'EPUB né su Google Books.`);
        }

        // 4. Prepariamo il nuovo libro
        const newBook = {
            title: epubData.title,
            author: epubData.author,
            description: googleData.description,
            coverPath: finalCoverPath 
        };

        // 5. Aggiornamento JSON
        console.log(`📝 Aggiornamento della libreria...`);
        let books = [];
        try {
            const fileData = await fs.readFile(booksJsonPath, 'utf-8');
            books = JSON.parse(fileData);
        } catch (e) {
            console.log("File books.json non trovato, ne creo uno nuovo.");
        }
        
        books.push(newBook);
        await fs.writeFile(booksJsonPath, JSON.stringify(books, null, 4));

        // 6. Pulizia
        await fs.unlink(file.path);

        console.log(`✅ Successo! Il libro è stato aggiunto allo scaffale.\n`);
        res.json({ success: true, message: 'Libro elaborato e aggiunto con successo!' });

    } catch (error) {
        console.error("❌ Errore critico durante l'elaborazione del libro:", error);
        res.status(500).json({ success: false, message: 'Errore interno del server.' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Backend in ascolto su http://localhost:${port}`);
});