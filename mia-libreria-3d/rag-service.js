import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OllamaEmbeddings, Ollama } from "@langchain/ollama";

// CACHE: Salviamo i database vettoriali in memoria.
// Così se fai 10 domande sullo stesso libro, lo legge e lo converte una volta sola!
const bookDatabases = {}; 

export async function askBookRAG(epubFilePath, question, currentSnippet) {
    try {
        // --- 1. LETTURA E CREAZIONE DEL DATABASE (Se non esiste già) ---
        if (!bookDatabases[epubFilePath]) {
            console.log(`\n📚 Prima apertura di ${epubFilePath}. Generazione database vettoriale...`);
            
            // Estrae tutto il testo pulito dall'EPUB
            const loader = new EPubLoader(epubFilePath);
            const rawDocs = await loader.load();

            // Taglia il libro in "fette" da 1000 caratteri, sovrapponendole di 200 
            // per non troncare frasi o concetti a metà.
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });
            const docs = await textSplitter.splitDocuments(rawDocs);

            // Usa il modello "Bibliotecario" per trasformare il testo in vettori e salvarlo in memoria
            const embeddings = new OllamaEmbeddings({
                model: "nomic-embed-text",
                baseUrl: "http://127.0.0.1:11434",
            });
            
            bookDatabases[epubFilePath] = await MemoryVectorStore.fromDocuments(docs, embeddings);
            console.log("✅ Database vettoriale creato con successo!\n");
        }

        const vectorStore = bookDatabases[epubFilePath];

        // --- 2. IL RAG (Ricerca Semantica) ---
        console.log(`🔍 Cerco nel libro informazioni su: "${question}"...`);
        
        // Uniamo la tua posizione con la domanda per dare un contesto forte alla ricerca
        const searchQuery = `${currentSnippet}\n${question}`;
        
        // Il Bibliotecario ci restituisce i 4 frammenti del libro più inerenti alla domanda
        const relevantChunks = await vectorStore.similaritySearch(searchQuery, 4);
        
        // Incolliamo i frammenti trovati
        const retrievedContext = relevantChunks.map(chunk => chunk.pageContent).join("\n\n---\n\n");

        // --- 3. GENERAZIONE DELLA RISPOSTA (Gemma 2) ---
        const llm = new Ollama({
            model: "gemma2:2b",
            baseUrl: "http://127.0.0.1:11434",
            temperature: 0.3 // Temperatura bassa per evitare allucinazioni
        });

        // Creiamo un prompt a prova di bomba che include il mirino
        const prompt = `Sei l'assistente IA di un e-reader. 
L'utente ti ha fatto una domanda. 

Sappi che in questo momento l'utente sta guardando questa precisa frase nel libro:
"${currentSnippet}"

Per rispondere, utilizza ESCLUSIVAMENTE queste informazioni trovate nel libro:
${retrievedContext}

Domanda dell'utente: ${question}
Rispondi in modo chiaro, utile e in italiano. Se la risposta non è nel contesto, dillo chiaramente.`;

        const response = await llm.invoke(prompt);
        return response;

    } catch (error) {
        console.error("❌ Errore critico nel sistema RAG:", error);
        throw error;
    }
}