// src/i18n.js

export const translations = {
    it: {
        // Top Bar
        manageShelf: "⚙️ Gestisci",
        manageShelfTooltip: "Rinomina o elimina questa categoria",
        searchPlaceholder: "Cerca per titolo o autore...",
        uploadBtn: "+ Carica Ebook",
        loading: "Caricamento...",
        uploadingStatus: "⏳ Carico",

        // Pannello Info (In basso)
        showSynopsis: "Mostra Trama",
        showCover: "Mostra Copertina",

        exportAI: "🤖 Esporta per IA",
        generatingMD: "⏳ Generazione MD ...",
        exportToastMessage: "Generazione Knowledge Base (.md) per Obsidian/ IA ...",
        
        assignCategory: "🏷️ Assegna Categoria",
        moveBookTitle: "Sposta",
        saveBtn: "Salva",
        categoryPrompt: "Scrivi il nome della categoria...",
        
        deleteBook: "🗑️ Elimina",
        deleteConfirm: "Sei sicuro di voler eliminare DEFINITIVAMENTE \"{title}\"?\nL'azione cancellerà il file dal tuo computer e non può essere annullata.",
        serverError: "Errore di connessione al server.",
        cancelBtn: "Annulla",

        readBook: "Leggi Libro",

        // Etichette dinamiche e stati
        uncategorized: "Senza Categoria",
        shelfLabel: "📁 ",
        noCover: "[ Nessuna copertina trovata ]",
        allCategories: "Tutte le categorie",
        categoryPrompt: "Inserisci il nome della nuova categoria per questo libro:",
        
        // Help Modal (index.html/main.js logic)
        helpTitle: "Guida Rapida LoreKeeper",
        helpClose: "Ho capito!",

        // Reader (reader.js)
        epubError: "File EPUB non trovato per questo libro!",
        darkMode: "Modalità Scura",
        lightMode: "Modalità Chiara",
        // Risultati Upload
        uploadComplete: "Upload completato!",
        added: "Aggiunti",
        duplicates: "Duplicati ignorati",
        errors: "Errori",
        //load books
        textureError: "Impossibile caricare texture: ",
        shelfLog: "Creata mensola {name} ad altezza {y}",
        texturesSuccess: "Texture mensola attiva {cat} caricate.",
        allTexturesLoaded: "🎉 Tutte le texture sono state caricate in background senza lag!",
        // Retro Libro 3D
        backIn: "In: ",
        backPages: "Pagine stimate: ",

        // Messaggi Azioni
        categoryCreated: "Categoria creata!",
        categoryExisting: "Categoria già esistente",
        moveSuccess: "Spostamento completato!",
        selectBookError: "Seleziona almeno un libro.",
        genericError: "Si è verificato un errore."  
    },
    en: {
        // Top Bar
        manageShelf: "⚙️ Manage",
        manageShelfTooltip: "Rename or delete this category",
        searchPlaceholder: "Search by title or author...",
        uploadBtn: "+ Upload Ebook",
        loading: "Loading...",
        uploadingStatus: "⏳ Uploading",

        // Info Panel (Bottom)
        showSynopsis: "Show Synopsis",
        showCover: "Show Cover",
        exportAI: "🤖 Export for AI",
        generatingMD: "⏳ Generating MD ...",
        exportToastMessage: "Generating Knowledge Base (.md) for Obsidian/IA ...",
        assignCategory: "🏷️ Assign Category",
        moveBookTitle: "Move",
        saveBtn: "Save",
        categoryPrompt: "Enter the new category name for this book:",
        deleteBook: "🗑️ Delete",
        deleteConfirm: "Are you sure you want to PERMANENTLY delete \"{title}\"?\nThis action will remove the file from your computer and cannot be undone.",
        serverError: "Error connecting to the server.",
        cancelBtn: "Cancel",
        readBook: "Read Book",

        // Dynamic labels and states
        uncategorized: "Uncategorized",
        shelfLabel: "📁 ",
        noCover: "[ No cover found ]",
        allCategories: "All Categories",
        categoryPrompt: "Enter the new category name for this book:",

        // Help Modal
        helpTitle: "LoreKeeper Quick Guide",
        helpClose: "Got it!",

        // Reader
        epubError: "EPUB file not found for this book!",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",

        // Upload Results
        uploadComplete: "Upload complete!",
        added: "Added",
        duplicates: "Duplicates ignored",
        errors: "Errors",

        // load books 
        textureError: "Unable to load texture: ",
        shelfLog: "Created shelf {name} at height {y}",
        texturesSuccess: "Active shelf textures for {cat} loaded.",
        allTexturesLoaded: "🎉 All textures have been loaded in the background without lag!",

        // 3D Book Back
        backIn: "In: ",
        backPages: "Est. Pages: ",

        // Action Messages
        categoryCreated: "Category created!",
        categoryExisting: "Category already exists",
        moveSuccess: "Move completed!",
        selectBookError: "Please select at least one book.",
        genericError: "An error occurred."
    }
};

// Recupera la lingua salvata o usa l'inglese di default per il nuovo branch
export let currentLang = localStorage.getItem('lorekeeper_lang') || 'en';

/**
 * Funzione di traduzione
 * @param {string} key - La chiave della traduzione
 * @returns {string} - Il testo tradotto
 */
export function t(key) {
    if (!translations[currentLang][key]) {
        console.warn(`Traduzione mancante per la chiave: ${key}`);
        return key;
    }
    return translations[currentLang][key];
}

/**
 * Cambia lingua e ricarica l'app
 * @param {string} lang - 'it' o 'en'
 */
export function setLanguage(lang) {
    if (translations[lang]) {
        localStorage.setItem('lorekeeper_lang', lang);
        window.location.reload();
    }
}