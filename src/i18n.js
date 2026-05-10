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
        genericError: "Si è verificato un errore." , 

        //category manager
        catManagerTitle: "⚙️ Gestione Libreria",
        catManagerSubtitle: "Seleziona la mensola su cui vuoi operare:",
        booksCount: "libri",
        
        // Menu Azioni
        shelfOptions: "Opzioni Mensola",
        systemShelfNote: "Questa è la mensola di sistema. Puoi usarla per smistare i libri in nuove categorie, ma non puoi rinominarla o eliminarla.",
        renameShelfBtn: "✏️ Rinomina Categoria",
        createNewCatBtn: "📦 Crea Nuova Categoria (Sposta libri da qui)",
        addBooksToCatBtn: "📥 Aggiungi libri a questa categoria",
        deleteShelfBtn: "🗑️ Elimina Categoria",
        
        // Vista Rinomina
        renameTitle: "✏️ Rinomina Mensola",
        chooseNewName: "Scegli un nuovo nome per",
        emptyNameAlert: "Il nome della mensola non può essere vuoto!",
        sameNameAlert: "Inserisci un nome diverso da quello attuale.",
        saving: "Salvataggio...",
        
        // Vista Crea e Sposta
        createMoveTitle: "📦 Crea e Sposta",
        selectToMove: "Seleziona i libri da togliere da",
        selectAll: "Tutti",
        noBooksOnShelf: "Nessun libro su questa mensola.",
        newCatNameLabel: "Nome per la nuova categoria:",
        newCatPlaceholder: "Scrivi il nuovo nome...",
        transferBtn: "Trasferisci",
        selectMoveError: "Seleziona almeno un libro da spostare.",
        writeCatNameError: "Scrivi il nome della nuova mensola.",
        
        // Vista Importa
        importTitle: "📥 Aggiungi Libri",
        selectToImport: "Seleziona i libri da portare su",
        allBooksAlreadyHere: "Tutti i libri della libreria sono già qui.",
        importSelectedBtn: "📥 Importa Selezionati Qui",
        selectImportError: "Seleziona almeno un libro dalla lista.",
        
        // Vista Elimina
        deleteTitle: "🗑️ Elimina Mensola",
        deleteWarningTitle: "Attenzione!",
        deleteWarningText: "Stai per eliminare la categoria \"{cat}\".\nNessun file verrà cancellato, ma tutti i libri torneranno in \"Senza Categoria\".",
        confirmDeleteBtn: "Conferma Eliminazione",

        selectToImport: "Seleziona i libri da portare su",
        allBooksAlreadyHere: "Tutti i libri della libreria sono già qui.",
        importSelectedBtn: "📥 Importa Selezionati Qui",

        credits: "&copy; 2026 LoreKeeper - Tutti i diritti riservati. Creata da"
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
        genericError: "An error occurred.",

        //category manager
        catManagerTitle: "⚙️ Library Management",
        catManagerSubtitle: "Select the shelf you want to manage:",
        booksCount: "books",
        
        // Actions Menu
        shelfOptions: "Shelf Options",
        systemShelfNote: "This is the system shelf. You can use it to sort books into new categories, but you cannot rename or delete it.",
        renameShelfBtn: "✏️ Rename Category",
        createNewCatBtn: "📦 Create New Category (Move books from here)",
        addBooksToCatBtn: "📥 Add books to this category",
        deleteShelfBtn: "🗑️ Delete Category",
        
        // Rename View
        renameTitle: "✏️ Rename Shelf",
        chooseNewName: "Choose a new name for",
        emptyNameAlert: "Shelf name cannot be empty!",
        sameNameAlert: "Please enter a name different from the current one.",
        saving: "Saving...",
        
        // Create and Move View
        createMoveTitle: "📦 Create and Move",
        selectToMove: "Select books to remove from",
        selectAll: "All",
        noBooksOnShelf: "No books on this shelf.",
        newCatNameLabel: "New category name:",
        newCatPlaceholder: "Type the new name...",
        transferBtn: "Transfer",
        selectMoveError: "Select at least one book to move.",
        writeCatNameError: "Type the name of the new shelf.",
        
        // Import View
        importTitle: "📥 Add Books",
        selectToImport: "Select books to bring to",
        allBooksAlreadyHere: "All books are already here.",
        importSelectedBtn: "📥 Import Selected Here",
        selectImportError: "Select at least one book from the list.",
        
        // Delete View
        deleteTitle: "🗑️ Delete Shelf",
        deleteWarningTitle: "Warning!",
        deleteWarningText: "You are about to delete the category \"{cat}\".\nNo files will be deleted, but all books on this shelf will return to \"Uncategorized\".",
        confirmDeleteBtn: "Confirm Deletion",
        selectToImport: "Select books to bring to",
        allBooksAlreadyHere: "All library books are already here.",
        importSelectedBtn: "📥 Import Selected Here",
        
        credits: "&copy; 2026 LoreKeeper - All rights reserved. Created by"
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