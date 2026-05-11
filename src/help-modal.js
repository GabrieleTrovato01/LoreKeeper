import { t } from './i18n.js';

export function openHelpModal() {
    // 1. Setup Overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.zIndex = '2000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.backdropFilter = 'blur(5px)';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';

    // 2. Setup Contenitore Interno
    const modalBox = document.createElement('div');
    modalBox.className = 'glass-effect';
    modalBox.style.background = 'rgba(30, 30, 30, 0.85)';
    modalBox.style.padding = '35px';
    modalBox.style.borderRadius = '20px';
    modalBox.style.maxWidth = '450px';
    modalBox.style.width = '90%';
    modalBox.style.color = 'white';
    modalBox.style.border = '1px solid rgba(255,255,255,0.2)';

    // 3. Contenuto Tradotto Dinamicamente
    modalBox.innerHTML = `
        <h2 style="margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 15px; text-align: center; font-family: sans-serif;">
            ${t('helpTitle')}
        </h2>
        <ul style="line-height: 1.8; padding-left: 20px; font-family: sans-serif; font-size: 14.5px;">
            ${t('helpContent')}
        </ul>
        <button id="close-help-btn" class="modern-btn glass-effect" style="width: 100%; margin-top: 25px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);">
            ${t('helpClose')}
        </button>
    `;

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    // Fade In
    setTimeout(() => overlay.style.opacity = '1', 10);

    // 4. Logica di Chiusura
    const closeOverlay = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300); // Rimuove dal DOM dopo l'animazione
    };

    document.getElementById('close-help-btn').onclick = closeOverlay;
    overlay.onclick = (e) => { if (e.target === overlay) closeOverlay(); };
}