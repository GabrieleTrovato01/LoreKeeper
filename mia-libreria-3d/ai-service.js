// --- AI-SERVICE CON OLLAMA E GEMMA ---
// Non serve nessun import in cima! Usiamo la funzione nativa 'fetch' di Node.js

export async function generateResponse(question, context) {
    // 1. Debug del testo
    console.log("\n--- INIZIO RAGIONAMENTO IA (OLLAMA) ---");
    console.log("❓ Domanda dell'utente:", question);
    console.log("📄 Lunghezza contesto:", context.length);

    console.log("\n" + "=".repeat(60));
    console.log("📥 [DEBUG SERVER] TESTO RICEVUTO DAL FRONTEND:");
    console.log("-".repeat(60));
    
    // Stampiamo il contesto (tutto quello che il frontend ha inviato)
    console.log(context); 
    
    console.log("-".repeat(60));
    console.log("❓ DOMANDA:", question);
    console.log("📄 LUNGHEZZA TOTALE:", context.length, "caratteri");
    console.log("=".repeat(60) + "\n");

    if (context.length < 20) {
        return "Non riesco a leggere la pagina. Prova a scorrere leggermente.";
    }

    // 2. Tagliamo il testo (Gemma ha molta più memoria, possiamo passargliene di più!)
    const maxContextLength = 30000; 
    const trimmedContext = context.length > maxContextLength 
        ? context.substring(context.length - maxContextLength) 
        : context;

    // 3. Il Prompt in italiano per Gemma
    const prompt = `Sei l'assistente di un e-reader. Rispondi alla domanda in italiano in modo breve e amichevole, basandoti ESCLUSIVAMENTE sul testo fornito di seguito.
    
    Testo del capitolo:
    "${trimmedContext}"
    
    Domanda: ${question}`;

    console.log("⏳ Chiedo a Gemma tramite Ollama...");

    try {
        // 4. Facciamo la chiamata al server locale di Ollama (gira sulla porta 11434 di default)
        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma2:2b', // Assicurati di aver scaricato questo modello su Ollama
                prompt: prompt,
                stream: false, // Vogliamo la risposta tutta intera, non a pezzetti
                options:{
                    num_ctx: 8192, // Gemma ha una memoria enorme, possiamo sfruttarla!
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama ha risposto con errore: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const finalAnswer = data.response;

        console.log("✅ Risposta generata con successo!");
        console.log("--- FINE RAGIONAMENTO IA ---\n");
        
        return finalAnswer;

    } catch (error) {
        console.error("❌ Errore Ollama:", error);
        throw new Error("Assicurati che l'app Ollama sia aperta sul tuo computer e che il modello sia installato!");
    }
}