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

    currentBook.ready.then(() => {
    // Genera la mappa delle posizioni (1000 caratteri per "pagina" virtuale)
    return currentBook.locations.generate(1000);
    }).then(() => {
    console.log("✅ Mappa delle posizioni generata con successo");
    });
    
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
    rendition.on("keydown", keyListener);

    // 3. Pulizia quando il libro viene chiuso
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
        "p, span, div": { "color": "#e0e0e0" },
        "a": { "color": "#4da6ff" }
    });

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

function applyTheme() {
    const readerOverlay = document.getElementById('reader-overlay');
    const themeBtn = document.getElementById('theme-toggle-btn');

    if (isDarkMode) {
        readerOverlay.style.background = '#121212';
        if (rendition) rendition.themes.select("dark");
        if (themeBtn) themeBtn.innerText = '☀️ Light Mode';
    } else {
        readerOverlay.style.background = '#faf9f6';
        if (rendition) rendition.themes.select("light");
        if (themeBtn) themeBtn.innerText = '🌙 Dark Mode';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-reader-btn');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const themeBtn = document.getElementById('theme-toggle-btn');

    const chatBtn = document.getElementById('ai-chat-btn');
    const chatPanel = document.getElementById('ai-chat-panel');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const chatMessages = document.getElementById('chat-messages');

    if (closeBtn) {
        closeBtn.onclick = () => {
            window.closeReader();
            window.dispatchEvent(new Event('readerClosed')); 
        };
    }
    
    if (themeBtn) {
        themeBtn.onclick = () => {
            isDarkMode = !isDarkMode;
            localStorage.setItem('readerDarkMode', isDarkMode); 
            applyTheme();
        };
    }

    if (prevBtn) prevBtn.onclick = () => { if(rendition) rendition.prev(); };
    if (nextBtn) nextBtn.onclick = () => { if(rendition) rendition.next(); };

    if (chatBtn && chatPanel) {
        chatBtn.onclick = () => {
            chatPanel.style.display = 'flex';
            setTimeout(() => chatPanel.style.transform = 'translateX(0)', 10);
        };
    }
    
    if (closeChatBtn && chatPanel) {
        closeChatBtn.onclick = () => {
            chatPanel.style.transform = 'translateX(100%)';
            setTimeout(() => chatPanel.style.display = 'none', 300);
        };
    }

    // ... (tutta la parte iniziale rimane uguale fino a sendMessage)
    const sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text || !rendition) return;

    // 1. Interfaccia: Messaggio utente e caricamento
    chatMessages.innerHTML += `
        <div style="background: rgba(0, 150, 255, 0.4); padding: 10px 15px; border-radius: 15px 15px 0 15px; align-self: flex-end; max-width: 85%;">
            ${text}
        </div>`;
    chatInput.value = '';
    
    const loadingId = 'loading-' + Date.now();
    chatMessages.innerHTML += `
        <div id="${loadingId}" style="background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 15px 15px 15px 0; align-self: flex-start; max-width: 85%; font-style: italic;">
            Sto leggendo e ragionando... ⏳
        </div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Diamo al browser 10 millisecondi di respiro prima di fare il lavoro pesante.
            // Questo impedisce all'interfaccia di bloccarsi mentre gira pagina.
            await new Promise(resolve => setTimeout(resolve, 10));

            const location = rendition.currentLocation();
            const currentIframe = rendition.getContents()[0].document;
            
            // USIAMO SOLO textContent: è molto più leggero e non forza il browser
            // a calcolare la visibilità degli elementi CSS, evitando il "freeze" visivo.
            const fullTextRaw = currentIframe.body.textContent || "";
            
            // Puliamo il testo in modo efficiente
            const fullText = fullTextRaw.replace(/\s+/g, ' ').trim(); 
            let chapterText = fullText;

        if (location && location.start) {
            // 3. SNIPPET LUNGO: Estraiamo 250 caratteri dal punto esatto di lettura (CFI)
            const range = await rendition.book.getRange(location.start.cfi);
            const searchSnippet = range.toString().replace(/\s+/g, ' ').trim().substring(0, 250);

            // 4. CALCOLO POSIZIONE STIMATA
            // Usiamo la percentuale (ora disponibile grazie a locations.generate)
            const percentage = location.start.percentage || 0;
            const estimateStart = Math.floor(fullText.length * percentage);
            
            // Cerchiamo a partire da 3000 caratteri prima della stima per sicurezza
            const searchFrom = Math.max(0, estimateStart - 3000);
            
            console.log(`📍 Percorso: ${Math.round(percentage * 100)}% del libro | Cerco da indice: ${searchFrom}`);
            
            // 5. RICERCA MIRATA (ignora l'inizio del capitolo se siamo avanti)
            let currentIndex = fullText.indexOf(searchSnippet, searchFrom);

            // Se non lo trova lì, prova la ricerca globale (fallback)
            if (currentIndex === -1) {
                console.log("🔍 Snippet non trovato nella zona stimata, provo ricerca globale...");
                currentIndex = fullText.indexOf(searchSnippet);
            }

            // 6. TAGLIO DELLA FINESTRA CONTESTUALE
            if (currentIndex !== -1 && currentIndex !== 0) {
                console.log("🎯 Posizione reale trovata all'indice:", currentIndex);
                
                const charsBefore = 5000; // ~3 pagine prima
                const charsAfter = 5000;  // ~3 pagine dopo

                const startCut = Math.max(0, currentIndex - charsBefore);
                const endCut = Math.min(fullText.length, currentIndex + searchSnippet.length + charsAfter);

                chapterText = fullText.substring(startCut, endCut);
                console.log(`✅ Finestra centrata estratta (${chapterText.length} caratteri)`);
            } else if (currentIndex === 0) {
                console.warn("⚠️ Trovato indice 0 (probabile testata). Prendo i primi 10.000 caratteri.");
                chapterText = fullText.substring(0, 10000);
            }
        }

        // 7. Invio al server
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: text,
                context: chapterText
            })
        });

        const data = await response.json();
        
        // Rimuovi caricamento e mostra risposta
        const loadingElement = document.getElementById(loadingId);
        if(loadingElement) loadingElement.remove(); 
        
        if (data.success) {
            chatMessages.innerHTML += `
                <div style="background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 15px 15px 15px 0; align-self: flex-start; max-width: 85%;">
                    ${data.answer}
                </div>`;
        } else {
            throw new Error(data.message);
        }

    } catch (error) {
        console.error("Errore chat:", error);
        const loadingElement = document.getElementById(loadingId);
        if(loadingElement) loadingElement.remove();
        chatMessages.innerHTML += `<div style="color: #ff4444; font-size: 12px; align-self: center; background: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 10px;">Errore: ${error.message}</div>`;
    }
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    if (sendChatBtn) sendChatBtn.onclick = sendMessage;
    if (chatInput) chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
});