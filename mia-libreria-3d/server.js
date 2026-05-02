import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { EPub } from 'epub2';
import axios from 'axios';
import { generateResponse } from './ai-service.js';

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
            // Prende "Stephen_King_IT.epub" e lo fa diventare "Stephen King IT"
            extractedTitle = originalFileName.replace(/\.epub$/i, '').replace(/[_-]/g, ' ').trim();
            extractedAuthor = ''; // Lasciamo l'autore vuoto, ci penserà Google
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
// 2. Ricerca su Google Books (Sistema a Punteggio sui primi 10 risultati)
async function fetchGoogleBooksData(title, author) {
    let result = {
        description: "Trama non trovata su Google Books.",
        coverUrl: null,
        pageCount: 350,
        googleTitle: null,
        googleAuthor: null
    };

    try {
        // 1. Rimuoviamo le "Parole Avvelenate"
        const searchTitle = title === 'Titolo Sconosciuto' ? '' : title;
        const searchAuthor = author === 'Autore Sconosciuto' ? '' : author;
        
        const cleanQuery = `${searchTitle} ${searchAuthor}`.replace(/[_-]/g, ' ').trim();
        
        // 2. CHIEDIAMO I PRIMI 10 RISULTATI (maxResults=10)
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&langRestrict=it&printType=books&maxResults=10&key=AIzaSyDf-vxdHbYaoJJ0s65sR-9l_aIWoV2qgqA`;
        
        const response = await axios.get(url, { timeout: 8000 });

        if (response.data.items && response.data.items.length > 0) {
            let bestVolume = null;
            let highestScore = -1;

            // Estraiamo le parole chiave (più lunghe di 3 lettere) dalla nostra ricerca
            const queryWords = cleanQuery.toLowerCase().split(' ').filter(w => w.length > 3);

            // 3. IL SISTEMA A PUNTEGGIO: Valutiamo TUTTI i 10 risultati prima di decidere
            for (let item of response.data.items) {
                const volumeInfo = item.volumeInfo;
                const itemTitle = (volumeInfo.title || '').toLowerCase();
                const itemAuthors = (volumeInfo.authors || []).join(' ').toLowerCase();
                const fullText = `${itemTitle} ${itemAuthors}`;

                let score = 0;

                // Diamo un punto per ogni parola chiave trovata nel titolo o nell'autore di questo libro
                for (let word of queryWords) {
                    if (fullText.includes(word)) {
                        score++;
                    }
                }

                // BONUS: Diamo mezzo punto in più se il libro ha una descrizione (preferiamo libri con la trama!)
                if (volumeInfo.description) {
                    score += 0.5;
                }

                // Se questo libro ha un punteggio più alto del precedente, diventa il nuovo "Miglior Candidato"
                if (score > highestScore) {
                    highestScore = score;
                    bestVolume = volumeInfo;
                }
            }

            // Se per qualche assurdo motivo non abbiamo trovato nulla, prendiamo il primo per disperazione
            if (!bestVolume) {
                bestVolume = response.data.items[0].volumeInfo;
            }

            // 4. ESTRAIAMO I DATI DAL VINCITORE ASSOLUTO
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

        // 1. Estrazione dall'EPUB
        console.log(`⚙️  Estrazione metadati e copertina interna...`);
        const epubData = await parseEpub(file.path, baseName, file.originalname);

        // --- NUOVO: CONTROLLO DUPLICATI ---
        let currentBooks = [];
        try {
            const fileData = await fs.readFile(booksJsonPath, 'utf-8');
            currentBooks = JSON.parse(fileData);
        } catch (e) {
            // Se il file non esiste, l'array rimane vuoto
        }

        // Verifichiamo se esiste già un libro con lo stesso titolo E autore
        const isDuplicate = currentBooks.some(book => 
            book.title.toLowerCase().trim() === epubData.title.toLowerCase().trim() && 
            book.author.toLowerCase().trim() === epubData.author.toLowerCase().trim()
        );

        if (isDuplicate) {
            console.log(`🛑 Upload bloccato: "${epubData.title}" è già presente in libreria.`);
            
            // Pulizia: cancelliamo il file temporaneo nella cartella uploads
            try {
                await fs.unlink(file.path);
            } catch (err) {}

            return res.json({ 
                success: false, 
                message: 'Questo libro è già presente nel tuo scaffale!' 
            });
        }
        // ----------------------------------

        console.log(`✔️  Dati iniziali: "${epubData.title}" di ${epubData.author}`);

        // 2. Google Books
        console.log(`🔍 Ricerca dati su Google Books...`);
        const googleData = await fetchGoogleBooksData(epubData.title, epubData.author);

        // 3. AUTOCORREZIONE TITOLO E AUTORE
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

        // 4. IL FALLBACK DELLA COPERTINA
        let finalCoverPath = epubData.coverPath; 
        if (!finalCoverPath && googleData.coverUrl) {
            console.log(`🖼️  Copertina assente nell'EPUB. Download in corso da Google Books...`);
            finalCoverPath = await downloadCoverImage(googleData.coverUrl, baseName);
        }

        // 5. IL FALLBACK DELLA TRAMA
        let finalDescription = "Nessuna trama disponibile per questo libro.";
        let epubDesc = epubData.description;

        if (epubDesc) {
            epubDesc = epubDesc.replace(/^(EDGT[0-9]+[\r\n\s]*)/i, '').trim();
        }

        if (epubDesc && epubDesc.length > 30) {
            console.log(`📖 Trama valida trovata all'interno dell'EPUB!`);
            finalDescription = epubDesc;
        } else if (googleData.description && googleData.description !== "Trama non trovata su Google Books.") {
            console.log(`🌐 Trama EPUB assente o non valida. Trama scaricata da Google Books.`);
            finalDescription = googleData.description;
        }

        // 6. SALVATAGGIO DEL FILE EPUB DEFINITIVO
        const ebooksDir = path.join(publicDir, 'ebooks');
        if (!fsSync.existsSync(ebooksDir)) fsSync.mkdirSync(ebooksDir, { recursive: true });
        
        const finalEpubPath = `ebooks/${baseName}.epub`;
        await fs.rename(file.path, path.join(publicDir, finalEpubPath));

        // 7. PREPARAZIONE OGGETTO LIBRO
        const newBook = {
            id: baseName,
            title: finalTitle,
            author: finalAuthor,
            description: finalDescription, 
            coverPath: finalCoverPath,
            pageCount: googleData.pageCount || 350,
            epubPath: finalEpubPath
        };

        // 8. AGGIORNAMENTO DB JSON
        console.log(`📝 Aggiornamento della libreria...`);
        currentBooks.push(newBook);
        await fs.writeFile(booksJsonPath, JSON.stringify(currentBooks, null, 4));

        // 9. PULIZIA FINALE (Safety catch)
        try {
            await fs.unlink(file.path);
        } catch (unlinkError) {}

        console.log(`✅ Successo! "${newBook.title}" aggiunto allo scaffale.\n`);
        res.json({ success: true, message: 'Libro elaborato e aggiunto con successo!' });

    } catch (error) {
        console.error("❌ Errore critico durante l'elaborazione del libro:", error);
        res.status(500).json({ success: false, message: 'Errore interno del server.' });
    }
});

// --- ROTTA PER LA CHAT CON IA LOCALE ---
app.post('/api/chat', async (req, res) => {
    try {
        const { question, context } = req.body;

        // Richiamiamo direttamente la funzione importata!
        const responseText = await generateResponse(question, context);
        
        console.log("Risposta generata con successo.");
        res.json({ success: true, answer: responseText });

    } catch (error) {
        console.error("Errore nella chat AI:", error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Il mio cervello locale ha fatto cortocircuito." 
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 Backend in ascolto su http://localhost:${port}`);
});