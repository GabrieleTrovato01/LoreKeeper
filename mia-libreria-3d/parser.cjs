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

        const metadata = {
            id: epub.metadata.identifier || Date.now().toString(),
            title: epub.metadata.title || fileName.replace('.epub', ''),
            author: epub.metadata.creator || 'Autore Sconosciuto',
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