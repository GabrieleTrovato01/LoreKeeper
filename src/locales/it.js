export default {
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
        shelfTitlePrefix: "📁 ",
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

        credits: "&copy; 2026 LoreKeeper - Tutti i diritti riservati. Creata da",

        // help guide
        // --- LETTORE E HELP MODAL ---
        closeReader: "Chiudi Libro",
        helpTitle: "📖 Come funziona",
        helpClose: "Ho capito",
        helpContent: `
            <li><b>Carica un libro:</b> Clicca sul pulsante di caricamento (o trascina un file) per aggiungere i tuoi <b>.epub</b> personali.</li>
            <li><b>Cerca:</b> Usa la barra in alto per trovare rapidamente un libro scrivendo il titolo, l'autore o la categoria.</li>
            <li><b>Scorri i libri (Orizzontale):</b> Usa lo swipe a destra/sinistra, la rotellina del mouse o le frecce (← e →).</li>
            <li><b>Cambia Mensola (Verticale):</b> Usa lo swipe in alto/basso, o le frecce (↑ e ↓).</li>
            <li><b>Organizza e Gestisci:</b> Usa "🏷️ Assegna Categoria" in basso per spostare un singolo libro, oppure "⚙️ Gestisci" in alto.</li>
            <li><b>Leggi:</b> Clicca sul libro al centro per aprirlo e tuffarti nella lettura.</li>
            <li><b>Gira Pagina:</b> Durante la lettura, usa le frecce della tastiera (← e →) o i pulsanti a schermo.</li>
            <li><b>Esplora:</b> Usa "Mostra Trama" per voltare il libro 3D e leggere il retro.</li>
            <li><b>Dark Mode:</b> Clicca l'icona della luna nel lettore per non affaticare la vista.</li>
            <li><b style="color: #ba55d3;">🤖 Knowledge Base (Markdown):</b> Esporta per IA per estrarre una Knowledge Base formattata in <strong>Markdown (.md)</strong>. È pronta per Obsidian, Notion, ChatGPT o Claude!</li>
        ` ,
        donateBtn: "💙 Supporta",
        // Aggiungi questo in fondo all'oggetto export default
emptyLibraryMessage: "La tua libreria è vuota. Clicca su '+ Carica Ebook' per iniziare la tua collezione!",
};