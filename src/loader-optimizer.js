import * as THREE from 'three';

export class LibraryLoader {
    constructor(textureLoader) {
        this.textureLoader = textureLoader;
        this.cache = new Map();
    }

    // Carica una singola texture con una Promise
    async loadTexture(url) {
        if (this.cache.has(url)) return this.cache.get(url);
        
        return new Promise((resolve, reject) => {
            this.textureLoader.load(url, 
                (texture) => {
                    this.cache.set(url, texture);
                    resolve(texture);
                },
                undefined,
                (err) => reject(err)
            );
        });
    }

    // Funzione core per caricare i libri di una specifica mensola
    async loadShelfResources(booksInShelf) {
        console.log(`📦 Caricamento risorse per la mensola: ${booksInShelf[0]?.userData?.category}`);
        
        const promises = booksInShelf.map(async (book) => {
            if (book.userData.coverPath) {
                try {
                    const texture = await this.loadTexture(`/${book.userData.coverPath}`);
                    book.material[4].map = texture;
                    book.material[4].needsUpdate = true;
                } catch (e) {
                    console.warn("Impossibile caricare copertina per:", book.userData.title);
                }
            }
        });

        return Promise.all(promises);
    }
}