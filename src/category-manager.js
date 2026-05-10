import { t } from './i18n.js';
export function openCategoryManager(currentViewedCategory, booksArray) {
    // Variabile di stato: memorizza quale categoria stiamo gestendo in questo momento nel menu
    let selectedCategory = currentViewedCategory; 

    // 1. Setup dell'Overlay principale
    const overlay = document.createElement('div');
    overlay.id = 'category-manager-overlay';
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

    const style = document.createElement('style');
    style.innerHTML = `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
        .menu-btn { width: 100%; text-align: left; padding: 15px 20px; font-size: 15px; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
        .menu-btn:hover { background: rgba(255,255,255,0.15) !important; transform: translateX(5px); }
        .cat-select-btn { justify-content: space-between; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
    `;
    document.head.appendChild(style);

    // Contenitore interno che cambierà dinamicamente
    const modalBox = document.createElement('div');
    modalBox.className = 'glass-effect';
    modalBox.style.background = 'rgba(30, 30, 30, 0.95)';
    modalBox.style.padding = '30px';
    modalBox.style.borderRadius = '20px';
    modalBox.style.width = '500px';
    modalBox.style.maxWidth = '90%';
    modalBox.style.position = 'relative';
    modalBox.style.boxShadow = '0 15px 35px rgba(0,0,0,0.5)';
    
    // Bottone chiusura globale
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '15px';
    closeBtn.style.right = '20px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'white';
    closeBtn.style.fontSize = '26px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.opacity = '0.7';
    
    const contentArea = document.createElement('div');
    modalBox.appendChild(closeBtn);
    modalBox.appendChild(contentArea);
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    setTimeout(() => overlay.style.opacity = '1', 10);

    // --- UTILITY ---
    const closeOverlay = () => {
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.remove(); style.remove(); }, 300);
    };

    closeBtn.onclick = closeOverlay;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });

    // Header standard con tasto indietro
    const getHeader = (title) => `
        <div style="display: flex; align-items: center; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
            <button id="back-btn" style="background: none; border: none; color: #4da6ff; font-size: 20px; cursor: pointer; padding: 0 10px 0 0;">&#10094;</button>
            <h3 style="margin: 0; font-family: sans-serif;">${title}</h3>
        </div>
    `;

    // Funzioni per calcolare dinamicamente i dati in base alla categoria attualmente selezionata
    const getActiveBooks = () => booksArray.filter(b => b.userData.category === selectedCategory);
    const getOtherBooks = () => booksArray.filter(b => b.userData.category !== selectedCategory);
    const getAllCategories = () => {
        const cats = [...new Set(booksArray.map(b => b.userData.category))];
        // Ordiniamo mettendo "Senza Categoria" in cima
        return cats.sort((a, b) => a === 'Senza Categoria' ? -1 : (b === 'Senza Categoria' ? 1 : a.localeCompare(b)));
    };

    // --- VISTE DEL MENU ---

    // VISTA 0: DASHBOARD GLOBALE (Scegli quale mensola gestire)
    function renderDashboard() {
        const allCategories = getAllCategories();
        
        let html = `
            <h2 style="margin-top: 0; margin-bottom: 10px; text-align: center; font-family: sans-serif;">${t('catManagerTitle')}</h2>
            <p style="text-align: center; color: #aaa; font-size: 14px; margin-bottom: 25px;">${t('catManagerSubtitle')}</p>
            <div class="custom-scrollbar" style="max-height: 350px; overflow-y: auto; padding-right: 5px;">
        `;

        allCategories.forEach(cat => {
            const count = booksArray.filter(b => b.userData.category === cat).length;
            const isDef = cat === 'Senza Categoria';
            html += `
                <button class="modern-btn glass-effect menu-btn cat-select-btn" data-cat="${cat}">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 18px;">${isDef ? '📥' : '📁'}</span>
                        <span>${cat.toUpperCase()}</span>
                    </div>
                    <span style="background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 20px; font-size: 12px; color: #ddd;">${count} ${t('booksCount')}</span>
                </button>
            `;
        });

        html += `</div>`;
        contentArea.innerHTML = html;

        // Aggiungiamo i listener per far entrare l'utente nel menu della categoria scelta
        document.querySelectorAll('.cat-select-btn').forEach(btn => {
            btn.onclick = (e) => {
                selectedCategory = e.currentTarget.getAttribute('data-cat');
                renderMainMenu();
            };
        });
    }

    // VISTA 1: MENU AZIONI (Per la categoria selezionata)
    function renderMainMenu() {
        const isDefault = selectedCategory === 'Senza Categoria';
        
        let html = getHeader(t('shelfOptions'));
        html += `<h4 style="margin-top: -10px; margin-bottom: 25px; color: #4da6ff; text-align: center; font-size: 18px; letter-spacing: 1px;">${selectedCategory.toUpperCase()}</h4>`;

        if (isDefault) {
            html += `<div style="text-align: center; color: #aaa; font-size: 13px; margin-bottom: 20px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">${t('systemShelfNote')}</div>`;
        } else {
            html += `<button id="nav-rename" class="modern-btn glass-effect menu-btn" style="background: rgba(0, 150, 255, 0.2); border: 1px solid rgba(0, 150, 255, 0.4);">${t('renameShelfBtn')}</button>`;
        }

        html += `
            <button id="nav-create" class="modern-btn glass-effect menu-btn" style="background: rgba(255, 165, 0, 0.2); border: 1px solid rgba(255, 165, 0, 0.4);">${t('createNewCatBtn')}</button>
            <button id="nav-import" class="modern-btn glass-effect menu-btn" style="background: rgba(40, 167, 69, 0.2); border: 1px solid rgba(40, 167, 69, 0.4);">${t('addBooksToCatBtn')}</button>
        `;

        if (!isDefault) {
            html += `<button id="nav-delete" class="modern-btn glass-effect menu-btn" style="background: rgba(200, 50, 50, 0.2); border: 1px solid rgba(200, 50, 50, 0.4); color: #ff8888;">${t('deleteShelfBtn')}</button>`;
        }

        contentArea.innerHTML = html;

        // Il tasto indietro torna alla Dashboard Globale
        document.getElementById('back-btn').onclick = renderDashboard;

        if (!isDefault) document.getElementById('nav-rename').onclick = renderRename;
        document.getElementById('nav-create').onclick = renderCreate;
        document.getElementById('nav-import').onclick = renderImport;
        if (!isDefault) document.getElementById('nav-delete').onclick = renderDelete;
    }

    // VISTA 2: RINOMINA
    function renderRename() {
        contentArea.innerHTML = `
            ${getHeader(t('renameTitle'))}
            <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px; color: #ccc;">${t('chooseNewName')} <span style="color:white">${selectedCategory}</span>:</label>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <input type="text" id="rename-input" class="modern-input" value="${selectedCategory}" style="flex-grow: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); color: white;">
                <button id="action-rename" class="modern-btn glass-effect" style="padding: 10px 20px; background: rgba(0, 150, 255, 0.4); border: 1px solid rgba(0, 150, 255, 0.6);">${t('saveBtn')}</button>
            </div>
        `;
        document.getElementById('back-btn').onclick = renderMainMenu;
        
        document.getElementById('action-rename').onclick = async () => {
            const newName = document.getElementById('rename-input').value.trim();
            
            // 1. Controllo se il campo è vuoto
            if (!newName) {
                alert(t('emptyNameAlert'));
                return;
            }
            // 2. Controllo se il nome è rimasto uguale
            if (newName === selectedCategory) {
                alert(t('sameNameAlert'));
                return;
            }

            // 3. Feedback visivo: l'utente capisce che il sistema sta caricando
            const btn = document.getElementById('action-rename');
            btn.innerText = t('savingBtn');
            btn.disabled = true;

            try {
                const res = await fetch('/api/categories', { 
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ oldName: selectedCategory, newName: newName, action: 'rename' }) 
                });
                
                // Se la rotta backend non esiste o va in crash
                if (!res.ok) {
                    throw new Error(`Errore di rete. Codice: ${res.status}`);
                }
                
                const result = await res.json();
                
                if (result.success) {
                    // Successo! Ricarica e costruisci le nuove mensole
                    location.reload(); 
                } else {
                    // Il server ha risposto ma con un problema logico (es. nessun libro trovato)
                    alert("Ops: " + result.message);
                    btn.innerText = t('saveBtn');
                    btn.disabled = false;
                }
            } catch (e) { 
                console.error(e); 
                // Questo era silenzioso prima, ora lo vedremo a schermo!
                alert(t('serverError'));
                btn.innerText = t('saveBtn');
                btn.disabled = false;
            }
        };
    }

    // VISTA 3: CREA E SPOSTA
    function renderCreate() {
        const activeBooks = getActiveBooks();
        const otherCategories = getAllCategories().filter(c => c !== selectedCategory && c !== 'Senza Categoria');
        
        contentArea.innerHTML = `
            ${getHeader(t('createMoveTitle'))}
            
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px;">
                <label style="font-size: 14px; color: #ccc;">${t('selectToMove')} <span style="color:white">${selectedCategory}</span>:</label>
                ${activeBooks.length > 0 ? `
                <label style="font-size: 12px; color: #ffaa00; cursor: pointer; display: flex; align-items: center; gap: 5px; background: rgba(255,170,0,0.1); padding: 4px 8px; border-radius: 6px;">
                    <input type="checkbox" id="select-all-export" style="accent-color: #ffaa00; cursor: pointer; width: 14px; height: 14px;"> ${t('selectAll')}
                </label>` : ''}
            </div>

            <div class="custom-scrollbar" style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.5); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 15px;">
                ${activeBooks.length === 0 ? '<div style="padding: 15px; text-align: center; color: #888; font-size: 13px;">' + t('noBooksOnShelf') + '</div>' : ''}
                ${activeBooks.map(b => `
                    <label style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;">
                        <input type="checkbox" class="export-checkbox" value="${b.userData.id}" style="width: 16px; height: 16px; accent-color: #ffaa00; cursor: pointer;">
                        <span style="font-weight: bold; font-size: 13px; color: white;">${b.userData.title}</span>
                    </label>
                `).join('')}
            </div>
            
            <label style="display: block; margin-bottom: 8px; font-size: 14px; color: #ccc;">${t('newCatNameLabel')}</label>
            <div style="display: flex; gap: 10px;">
                <input type="text" id="new-cat-input" list="cat-suggestions" placeholder="${t('newCatPlaceholder')}" class="modern-input" style="flex-grow: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); color: white;">
                <datalist id="cat-suggestions">${otherCategories.map(c => `<option value="${c}">`).join('')}</datalist>
                <button id="action-create" class="modern-btn glass-effect" style="padding: 10px 20px; background: rgba(255, 165, 0, 0.4); border: 1px solid rgba(255, 165, 0, 0.6);">${t('transferBtn')}</button>
            </div>
        `;
        document.getElementById('back-btn').onclick = renderMainMenu;

        const selectAllExport = document.getElementById('select-all-export');
        if (selectAllExport) {
            selectAllExport.onchange = (e) => {
                document.querySelectorAll('.export-checkbox').forEach(cb => cb.checked = e.target.checked);
            };
        }

        document.getElementById('action-create').onclick = async () => {
            const selectedIds = Array.from(document.querySelectorAll('.export-checkbox:checked')).map(cb => cb.value);
            const newCatName = document.getElementById('new-cat-input').value.trim();
            if (selectedIds.length === 0) { alert(t('selectMoveError')); return; }
            if (!newCatName) { alert(t('writeCatNameError')); return; }
            try {
                const res = await fetch('/api/books/bulk-tags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookIds: selectedIds, newTag: newCatName }) });
                const result = await res.json();
                if (result.success) location.reload(); else alert(result.message);
            } catch (e) { console.error(e); }
        };
    }

    // VISTA 4: IMPORTA LIBRI
    function renderImport() {
        const otherBooks = getOtherBooks();
        
        contentArea.innerHTML = `
            ${getHeader(t('importTitle'))}
            
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px;">
                <label style="font-size: 14px; color: #ccc;">${t('selectToImport')} <span style="color:white">${selectedCategory}</span>:</label>
                ${otherBooks.length > 0 ? `
                <label style="font-size: 12px; color: #4da6ff; cursor: pointer; display: flex; align-items: center; gap: 5px; background: rgba(77,166,255,0.1); padding: 4px 8px; border-radius: 6px;">
                    <input type="checkbox" id="select-all-import" style="accent-color: #4da6ff; cursor: pointer; width: 14px; height: 14px;"> ${t('selectAll')}
                </label>` : ''}
            </div>

            <div class="custom-scrollbar" style="max-height: 250px; overflow-y: auto; background: rgba(0,0,0,0.5); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 15px;">
                ${otherBooks.length === 0 ? '<div style="padding: 15px; text-align: center; color: #888; font-size: 13px;">' + t('allBooksAlreadyHere') + '</div>' : ''}
                ${otherBooks.map(b => `
                    <label style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;">
                        <input type="checkbox" class="import-checkbox" value="${b.userData.id}" style="width: 16px; height: 16px; accent-color: #4da6ff; cursor: pointer;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: bold; font-size: 13px; color: white;">${b.userData.title}</span>
                            <span style="font-size: 11px; color: #aaa;">In: ${b.userData.category}</span>
                        </div>
                    </label>
                `).join('')}
            </div>
            <button id="action-import" class="modern-btn glass-effect" style="width: 100%; background: rgba(40, 167, 69, 0.4); border: 1px solid rgba(40, 167, 69, 0.6);">${t('importSelectedBtn')}</button>
        `;
        document.getElementById('back-btn').onclick = renderMainMenu;

        const selectAllImport = document.getElementById('select-all-import');
        if (selectAllImport) {
            selectAllImport.onchange = (e) => {
                document.querySelectorAll('.import-checkbox').forEach(cb => cb.checked = e.target.checked);
            };
        }

        document.getElementById('action-import').onclick = async () => {
            const selectedIds = Array.from(document.querySelectorAll('.import-checkbox:checked')).map(cb => cb.value);
            if (selectedIds.length === 0) { alert(t('selectImportError')); return; }
            try {
                const res = await fetch('/api/books/bulk-tags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookIds: selectedIds, newTag: selectedCategory }) });
                const result = await res.json();
                if (result.success) location.reload(); else alert(result.message);
            } catch (e) { console.error(e); }
        };
    }

    // VISTA 5: ELIMINA MENSOLA
    function renderDelete() {
        contentArea.innerHTML = `
            ${getHeader(t('deleteTitle'))}
            <div style="background: rgba(200, 50, 50, 0.2); border: 1px solid rgba(200, 50, 50, 0.4); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                <h3 style="color: #ff8888; margin-top: 0;">${t('deleteWarningTitle')}</h3>
                <p style="font-size: 14px; line-height: 1.5; margin-bottom: 0;">${t('deleteWarningText').replace('{cat}', selectedCategory)}</p>
            </div>
            <button id="action-delete" class="modern-btn glass-effect" style="width: 100%; background: rgba(200, 50, 50, 0.5); color: white; border: 1px solid rgba(200, 50, 50, 0.8);">${t('confirmDeleteBtn')}</button>
        `;
        document.getElementById('back-btn').onclick = renderMainMenu;
        document.getElementById('action-delete').onclick = async () => {
            try {
                const res = await fetch('/api/categories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldName: selectedCategory, newName: null, action: 'delete' }) });
                const result = await res.json();
                if (result.success) location.reload(); else alert(result.message);
            } catch (e) { console.error(e); }
        };
    }

    // Inizializza l'interfaccia aprendo subito la Dashboard Globale
    renderDashboard();
}