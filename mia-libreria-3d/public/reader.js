let currentBook = null;
let rendition = null;

// Recuperiamo la preferenza salvata (di base è falso)
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
    
    rendition = currentBook.renderTo("viewer", {
        width: "100%",
        height: "100%",
        spread: "none"
    });

    const keyListener = function(e) {
        if (e.key === "ArrowRight") rendition.next();
        if (e.key === "ArrowLeft") rendition.prev();
    };
    document.addEventListener("keydown", keyListener);

    // 2. Ascolta i tasti premuti DENTRO il libro (iframe)
    // Dobbiamo farlo ogni volta che viene visualizzata una nuova pagina
    rendition.on("keydown", keyListener);

    // 3. Pulizia quando il libro viene chiuso
    // Dobbiamo rimuovere l'ascoltatore globale per non creare conflitti col carosello 3D
    window.addEventListener('readerClosed', () => {
        document.removeEventListener("keydown", keyListener);
    }, { once: true });

    // --- REGISTRAZIONE TEMI EPUB.JS ---
    rendition.themes.register("light", {
        "body": { "background": "#faf9f6", "color": "#000000" },
        "p, span, div": { "color": "#000000" }
    });
    rendition.themes.register("dark", {
        "body": { "background": "#121212", "color": "#e0e0e0" },
        "p, span, div": { "color": "#e0e0e0" }, // Forza il testo a essere chiaro
        "a": { "color": "#4da6ff" } // Rende i link visibili sul nero
    });

    // Applichiamo subito il tema corretto in base alla preferenza salvata
    applyTheme();

    const savedLocation = localStorage.getItem(`bookmark_${bookId}`);
    if (savedLocation) {
        rendition.display(savedLocation);
    } else {
        rendition.display();
    }

    rendition.on('relocated', function(location) {
        localStorage.setItem(`bookmark_${bookId}`, location.start.cfi);
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
    }, 800); 
};

// --- NUOVA FUNZIONE: Applica il Tema ---
function applyTheme() {
    const readerOverlay = document.getElementById('reader-overlay');
    const themeBtn = document.getElementById('theme-toggle-btn');

    if (isDarkMode) {
        // Applica Scuro
        readerOverlay.style.background = '#121212';
        if (rendition) rendition.themes.select("dark");
        if (themeBtn) themeBtn.innerText = '☀️ Light Mode';
    } else {
        // Applica Chiaro
        readerOverlay.style.background = '#faf9f6';
        if (rendition) rendition.themes.select("light");
        if (themeBtn) themeBtn.innerText = '🌙 Dark Mode';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-reader-btn');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const themeBtn = document.getElementById('theme-toggle-btn'); // Il nuovo bottone

    if (closeBtn) {
        closeBtn.onclick = () => {
            window.closeReader();
            window.dispatchEvent(new Event('readerClosed')); 
        };
    }
    
    // Al click sul bottone del tema, invertiamo lo stato e salviamo!
    if (themeBtn) {
        themeBtn.onclick = () => {
            isDarkMode = !isDarkMode;
            localStorage.setItem('readerDarkMode', isDarkMode); // Salviamo in memoria
            applyTheme();
        };
    }

    if (prevBtn) prevBtn.onclick = () => { if(rendition) rendition.prev(); };
    if (nextBtn) nextBtn.onclick = () => { if(rendition) rendition.next(); };
});