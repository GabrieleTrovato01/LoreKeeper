let currentBook = null;
let rendition = null;

// La variabile globale per ricordare lo stato
let isDarkMode = localStorage.getItem('readerDarkMode') === 'true';

window.openReader = function(epubUrl, bookId) {
    if (!epubUrl) {
        alert("File EPUB non trovato per questo libro!");
        return;
    }

    const readerOverlay = document.getElementById('reader-overlay');
    const viewer = document.getElementById('viewer');

    if (!readerOverlay || !viewer) {
        console.error("ERRORE: Manca l'HTML del lettore in index.html!");
        return;
    }

    readerOverlay.style.display = 'block';
    setTimeout(() => readerOverlay.style.opacity = '1', 50);

    currentBook = ePub(epubUrl);

    currentBook.ready.then(() => {
        return currentBook.locations.generate(1000);
    }).then(() => {
        console.log("✅ Mappa delle posizioni generata con successo");
    }).catch(err => console.warn("Avviso mappa posizioni:", err));
    
    // Ritorna a scorrimento paginato fluido e a tutto schermo
    rendition = currentBook.renderTo("viewer", {
        width: "100%",
        height: "100%",
        spread: "none",
        flow: "paginated",
        manager: "continuous",
        allowScriptedContent: true // Sblocca la sandbox
    });

    const keyListener = function(e) {
        if (e.key === "ArrowRight") rendition.next();
        if (e.key === "ArrowLeft") rendition.prev();
    };
    document.addEventListener("keydown", keyListener);
    rendition.on("keydown", keyListener);

    window.addEventListener('readerClosed', () => {
        document.removeEventListener("keydown", keyListener);
    }, { once: true });

    // 🔥 FIX 1: Controllo del "Segnalibro Avvelenato"
    const rawLocation = localStorage.getItem(`bookmark_${bookId}`);
    // Assicuriamoci che non sia "undefined" o "null" come stringa!
    const isValidLocation = rawLocation && rawLocation !== "undefined" && rawLocation !== "null";
    
    const displayPromise = isValidLocation ? rendition.display(rawLocation) : rendition.display();

    // 🔥 FIX 2: Fallback di emergenza. Se la pagina salvata è rotta, apri la copertina.
    displayPromise.then(() => {
        window.applyCurrentTheme();
    }).catch(err => {
        console.error("Errore nel caricamento della pagina salvata, forzo la copertina:", err);
        rendition.display(); // Ripiega sulla prima pagina se qualcosa va storto
    });

    rendition.on("rendered", () => {
        window.applyCurrentTheme();
    });

    rendition.on('relocated', function(location) {
        // 🔥 FIX 3: Salviamo la posizione solo se esiste davvero
        if (location && location.start && location.start.cfi) {
            localStorage.setItem(`bookmark_${bookId}`, location.start.cfi);
            
            const progressEl = document.getElementById('reading-progress');
            if (progressEl) {
                const percentage = location.start.percentage;
                progressEl.innerText = (percentage !== undefined && percentage > 0) ? Math.round(percentage * 100) + "%" : "1%";
            }
        }
    });
};

window.closeReader = function() {
    const readerOverlay = document.getElementById('reader-overlay');
    const viewer = document.getElementById('viewer');
    
    if (readerOverlay) readerOverlay.style.opacity = '0';
    
    setTimeout(() => {
        if (readerOverlay) readerOverlay.style.display = 'none';
        if (viewer) viewer.innerHTML = ''; 
        
        if (currentBook) {
            currentBook.destroy();
            currentBook = null;
            rendition = null;
        }

        window.dispatchEvent(new Event('readerClosed'));
    }, 800); 
};

window.applyCurrentTheme = function() {
    const readerOverlay = document.getElementById('reader-overlay');
    const themeBtn = document.getElementById('theme-toggle-btn');

    if (isDarkMode) {
        if (readerOverlay) readerOverlay.style.background = '#121212';
        if (themeBtn) themeBtn.innerText = '☀️ Light Mode';
    } else {
        if (readerOverlay) readerOverlay.style.background = '#faf9f6';
        if (themeBtn) themeBtn.innerText = '🌙 Dark Mode';
    }

    if (rendition && typeof rendition.getContents === 'function') {
        const activePages = rendition.getContents();
        
        activePages.forEach(contents => {
            // 🔥 FIX 4: Assicuriamoci che l'iframe e il suo tag <head> siano completamente pronti
            if (!contents || !contents.document || !contents.document.head) return;

            let styleTag = contents.document.getElementById("custom-bulletproof-theme");
            
            if (!styleTag) {
                styleTag = contents.document.createElement("style");
                styleTag.id = "custom-bulletproof-theme";
                contents.document.head.appendChild(styleTag);
            }

            if (isDarkMode) {
                styleTag.innerHTML = `
                    html, body { background-color: #121212 !important; }
                    * { color: #e0e0e0 !important; background-color: transparent !important; }
                    a, a * { color: #4da6ff !important; }
                    img, svg { filter: brightness(0.85); }
                `;
            } else {
                styleTag.innerHTML = `
                    html, body { background-color: #faf9f6 !important; }
                    * { color: #000000 !important; background-color: transparent !important; }
                    a, a * { color: #0066cc !important; }
                    img, svg { filter: brightness(1); }
                `;
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const nextBtn = document.getElementById('next-page-btn');
    const prevBtn = document.getElementById('prev-page-btn');
    const themeBtn = document.getElementById('theme-toggle-btn');
    const closeReaderBtn = document.getElementById('close-reader-btn');

    if (prevBtn) prevBtn.onclick = () => { if(rendition) rendition.prev(); };
    if (nextBtn) nextBtn.onclick = () => { if(rendition) rendition.next(); };

    if (themeBtn) {
        themeBtn.onclick = () => {
            isDarkMode = !isDarkMode; 
            localStorage.setItem('readerDarkMode', isDarkMode); 
            window.applyCurrentTheme(); 
        };
    }

    if (closeReaderBtn) {
        closeReaderBtn.onclick = () => window.closeReader();
    }
});