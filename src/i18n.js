export let currentLang = localStorage.getItem('lorekeeper_lang') || 'en';
let translations = {}; // Inizialmente vuoto

/**
 * Carica solo il file della lingua necessaria
 */
export async function initI18n() {
    // Sincronizziamo la variabile con il localStorage prima di caricare il modulo
    currentLang = localStorage.getItem('lorekeeper_lang') || 'it';
    
    try {
        // Il percorso deve essere relativo alla posizione di i18n.js
        const module = await import(`./locales/${currentLang}.js`);
        translations = module.default;
        console.log(`Lingua caricata: ${currentLang}`);
    } catch (error) {
        console.error("Errore nel caricamento della lingua:", error);
        // Fallback su italiano se l'import fallisce
        const fallback = await import(`./locales/it.js`);
        translations = fallback.default;
    }
}

// src/i18n.js
export function t(key) {
    // Se translations è ancora vuoto, prova a restituire qualcosa di sensato 
    // o aspetta che startApp abbia finito.
    if (!translations || Object.keys(translations).length === 0) {
        return ""; // Meglio vuoto che il nome della variabile "manageShelf"
    }
    
    if (!translations[key]) {
        console.warn(`Traduzione mancante per: ${key}`);
        return key;
    }
    return translations[key];
}

export function setLanguage(lang) {
    localStorage.setItem('lorekeeper_lang', lang);
    window.location.reload();
}