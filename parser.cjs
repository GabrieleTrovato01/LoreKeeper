const { decapsulate } = require('crypto');
const { EPub } = require('epub2');
const fs = require('fs-extra');
const path = require('path');

const EBOOKS_DIR = './ebooks';
const OUTPUT_JSON = './public/books.json';
const COVERS_DIR = './public/covers';

// Assicuriamoci che la cartella delle copertine esista
fs.ensureDirSync(COVERS_DIR);

async function extractBookData(fileName) {
    const filePath = path.join(EBOOKS_DIR, fileName);

    try {
        // epub2 usa le funzioni moderne (createAsync)
        const epub = await EPub.createAsync(filePath);
        let rawDescription = epub.metadata.description ? epub.metadata.description.replace(/<[^>]+>/g, '').trim() : '';

        // Se la descrizione è troppo corta (es. "EDGT2190123" ha una sola parola) o manca, chiediamo a Google!
        if (!rawDescription || rawDescription.split(' ').length < 10) {
            console.log(`🔍 Trama assente o non valida per "${epub.metadata.title}". Cerco su Google Books...`);
            const googlePlot = await fetchPlotFromGoogle(epub.metadata.title, epub.metadata.creator);
            
            if (googlePlot) {
                rawDescription = googlePlot;
                console.log(`✅ Trama scaricata da internet!`);
            } else {
                rawDescription = "Trama non disponibile al momento.";
            }
        }

        const metadata = {
            id: epub.metadata.identifier || Date.now().toString(),
            title: epub.metadata.title || fileName.replace('.epub', ''),
            author: epub.metadata.creator || 'Autore Sconosciuto',
            description: rawDescription, // Inseriamo la trama pulita o scaricata
            fileName: fileName,
            coverPath: `covers/${fileName.replace('.epub', '.jpg')}`
        };

        // Recuperiamo l'ID dell'immagine di copertina
        const coverId = epub.metadata.cover;
        
        if (coverId) {
            // Estraiamo l'immagine fisicamente dall'archivio
            const [buffer, mimeType] = await epub.getImageAsync(coverId);
            const fullCoverPath = path.join('./public', metadata.coverPath);
            
            // Salviamo il file .jpg
            fs.writeFileSync(fullCoverPath, buffer);
            console.log(`✅ Estrapolato con copertina: ${metadata.title}`);
        } else {
            console.log(`⚠️ Nessuna copertina interna trovata per: ${metadata.title}`);
            // Rimuoviamo il percorso della copertina se non esiste, così Three.js saprà di non caricarla
            metadata.coverPath = null; 
        }

        return metadata;

    } catch (error) {
        console.error(`❌ Errore durante l'apertura di ${fileName}:`, error.message);
        return null; // Salta il libro corrotto e passa al prossimo
    }
}

// Funzione per cercare la trama su Google Books
async function fetchPlotFromGoogle(title, author) {
    try {
        // Creiamo la query di ricerca codificando gli spazi
        const query = encodeURIComponent(`intitle:${title} inauthor:${author}`);
        const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&langRestrict=it`; // Cerchiamo in italiano
        
        const response = await fetch(url);
        const data = await response.json();

        // Se Google trova il libro e ha una descrizione, la restituiamo
        if (data.items && data.items.length > 0 && data.items[0].volumeInfo.description) {
            // Rimuoviamo eventuali tag HTML che Google a volte lascia
            return data.items[0].volumeInfo.description.replace(/<[^>]+>/g, '').trim();
        }
    } catch (error) {
        console.log(`⚠️ Impossibile contattare Google Books per: ${title}`);
    }
    
    return null; // Se fallisce, restituisce null
}

async function main() {
    const files = fs.readdirSync(EBOOKS_DIR).filter(f => f.endsWith('.epub'));
    const allBooks = [];

    console.log(`Trovati ${files.length} libri. Inizio elaborazione...`);

    for (const file of files) {
        const data = await extractBookData(file);
        if (data) {
            allBooks.push(data); // Aggiungiamo il libro al JSON solo se è andato tutto a buon fine
        }
    }

    // Scriviamo il file JSON finale
    fs.writeJsonSync(OUTPUT_JSON, allBooks, { spaces: 2 });
    console.log('\n--- OPERAZIONE COMPLETATA ---');
    console.log(`Dati salvati in ${OUTPUT_JSON}`);
}

main();