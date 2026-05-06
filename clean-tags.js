import fs from 'fs/promises';
import path from 'path';

// Percorso del tuo database
const booksJsonPath = path.join(process.cwd(), 'public', 'books.json');

async function cleanTags() {
    try {
        console.log('🧹 Inizio la pulizia del database...');
        
        // 1. Legge il file attuale
        const data = await fs.readFile(booksJsonPath, 'utf-8');
        let books = JSON.parse(data);

        // 2. Svuota l'array dei tag per ogni singolo libro
        let booksUpdated = 0;
        books.forEach(book => {
            if (book.tags && book.tags.length > 0) {
                book.tags = []; // Resetta i tag a un array vuoto
                booksUpdated++;
            } else if (!book.tags) {
                book.tags = []; // Crea l'array vuoto se per caso non esisteva
            }
        });

        // 3. Salva le modifiche
        await fs.writeFile(booksJsonPath, JSON.stringify(books, null, 4));
        
        console.log(`✅ Operazione completata! Rimossi i tag da ${booksUpdated} libri.`);
        console.log(`📚 Ora tutti i libri si trovano sulla mensola "Senza Categoria".`);

    } catch (error) {
        console.error('❌ Errore durante la pulizia:', error);
    }
}

// Esegue la funzione
cleanTags();