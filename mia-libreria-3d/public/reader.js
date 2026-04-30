let currentBook = null;
let rendition = null;

// Funzione globale per aprire il lettore
window.openReader = function(epubUrl, bookId) {
    if (!epubUrl) {
        alert("File EPUB non trovato per questo libro!");
        return;
    }

    // Cerchiamo gli elementi SOLO quando apriamo il libro
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

    const savedLocation = localStorage.getItem(`bookmark_${bookId}`);
    if (savedLocation) {
        console.log("Riprendo dalla posizione:", savedLocation);
        rendition.display(savedLocation);
    } else {
        rendition.display();
    }

    rendition.on('relocated', function(location) {
        localStorage.setItem(`bookmark_${bookId}`, location.start.cfi);
    });
};

// Funzione globale per chiuderlo
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

// Aspettiamo che il DOM (l'HTML) sia pronto prima di agganciare i click ai pulsanti
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-reader-btn');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    if (closeBtn) {
        closeBtn.onclick = () => {
            window.closeReader();
            window.dispatchEvent(new Event('readerClosed')); 
        };
    }
    if (prevBtn) prevBtn.onclick = () => { if(rendition) rendition.prev(); };
    if (nextBtn) nextBtn.onclick = () => { if(rendition) rendition.next(); };
});