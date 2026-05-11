export default {
        // Top Bar
        manageShelf: "⚙️ Manage",
        manageShelfTooltip: "Rename or delete this category",
        searchPlaceholder: "Search by title or author...",
        uploadBtn: "+ Upload Ebook",
        loading: "Loading...",
        uploadingStatus: "⏳ Uploading",

        // Info Panel (Bottom)
        showSynopsis: "Show Synopsis",
        showCover: "Show Cover",
        exportAI: "🤖 Export for AI",
        generatingMD: "⏳ Generating MD ...",
        exportToastMessage: "Generating Knowledge Base (.md) for Obsidian/IA ...",

        assignCategory: "🏷️ Assign Category",
        moveBookTitle: "Move",
        saveBtn: "Save",
        categoryPrompt: "Enter the new category name for this book:",

        deleteBook: "🗑️ Delete",
        deleteConfirm: "Are you sure you want to PERMANENTLY delete \"{title}\"?\nThis action will remove the file from your computer and cannot be undone.",
        serverError: "Error connecting to the server.",
        cancelBtn: "Cancel",

        readBook: "Read Book",

        // Dynamic labels and states
        uncategorized: "Uncategorized",
        shelfLabel: "📁 ",
        shelfTitlePrefix: "📁 ",
        noCover: "[ No cover found ]",
        allCategories: "All Categories",
        categoryPrompt: "Enter the new category name for this book:",

        // Help Modal
        helpTitle: "LoreKeeper Quick Guide",
        helpClose: "Got it!",

        // Reader
        epubError: "EPUB file not found for this book!",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",

        // Upload Results
        uploadComplete: "Upload complete!",
        added: "Added",
        duplicates: "Duplicates ignored",
        errors: "Errors",

        // load books 
        textureError: "Unable to load texture: ",
        shelfLog: "Created shelf {name} at height {y}",
        texturesSuccess: "Active shelf textures for {cat} loaded.",
        allTexturesLoaded: "🎉 All textures have been loaded in the background without lag!",

        // 3D Book Back
        backIn: "In: ",
        backPages: "Est. Pages: ",

        // Action Messages
        categoryCreated: "Category created!",
        categoryExisting: "Category already exists",
        moveSuccess: "Move completed!",
        selectBookError: "Please select at least one book.",
        genericError: "An error occurred.",

        //category manager
        catManagerTitle: "⚙️ Library Management",
        catManagerSubtitle: "Select the shelf you want to manage:",
        booksCount: "books",
        
        // Actions Menu
        shelfOptions: "Shelf Options",
        systemShelfNote: "This is the system shelf. You can use it to sort books into new categories, but you cannot rename or delete it.",
        renameShelfBtn: "✏️ Rename Category",
        createNewCatBtn: "📦 Create New Category (Move books from here)",
        addBooksToCatBtn: "📥 Add books to this category",
        deleteShelfBtn: "🗑️ Delete Category",
        
        // Rename View
        renameTitle: "✏️ Rename Shelf",
        chooseNewName: "Choose a new name for",
        emptyNameAlert: "Shelf name cannot be empty!",
        sameNameAlert: "Please enter a name different from the current one.",
        saving: "Saving...",
        
        // Create and Move View
        createMoveTitle: "📦 Create and Move",
        selectToMove: "Select books to remove from",
        selectAll: "All",
        noBooksOnShelf: "No books on this shelf.",
        newCatNameLabel: "New category name:",
        newCatPlaceholder: "Type the new name...",
        transferBtn: "Transfer",
        selectMoveError: "Select at least one book to move.",
        writeCatNameError: "Type the name of the new shelf.",
        
        // Import View
        importTitle: "📥 Add Books",
        selectToImport: "Select books to bring to",
        allBooksAlreadyHere: "All books are already here.",
        importSelectedBtn: "📥 Import Selected Here",
        selectImportError: "Select at least one book from the list.",
        
        // Delete View
        deleteTitle: "🗑️ Delete Shelf",
        deleteWarningTitle: "Warning!",
        deleteWarningText: "You are about to delete the category \"{cat}\".\nNo files will be deleted, but all books on this shelf will return to \"Uncategorized\".",
        confirmDeleteBtn: "Confirm Deletion",
        selectToImport: "Select books to bring to",
        allBooksAlreadyHere: "All library books are already here.",
        importSelectedBtn: "📥 Import Selected Here",

        credits: "&copy; 2026 LoreKeeper - All rights reserved. Created by",

        //help guide 
        closeReader: "Close Book",
        helpTitle: "📖 How it works",
        helpClose: "Got it",
        helpContent: `
            <li><b>Upload a book:</b> Click the upload button (or drag a file) to add your personal <b>.epub</b> files to the shelf.</li>
            <li><b>Search:</b> Use the top bar to quickly find a book by typing the title, author, or category.</li>
            <li><b>Scroll books (Horizontal):</b> Swipe left/right, use the mouse wheel, or arrows (← and →) to browse books on the same shelf.</li>
            <li><b>Change Shelf (Vertical):</b> Swipe up/down, or use arrows (↑ and ↓) to "fly" to upper or lower categories.</li>
            <li><b>Organize and Manage:</b> Use "🏷️ Assign Category" at the bottom to move a single book, or "⚙️ Manage" at the top to rename or delete the entire shelf.</li>
            <li><b>Read:</b> Click the book in the center to open it and dive into reading.</li>
            <li><b>Turn Page:</b> While reading, use the keyboard arrows (← and →) or on-screen buttons.</li>
            <li><b>Explore:</b> Use "Show Synopsis" to flip the 3D book and read the back cover.</li>
            <li><b>Dark Mode:</b> Click the moon icon in the reader to reduce eye strain.</li>
            <li><b style="color: #ba55d3;">🤖 Knowledge Base (Markdown):</b> Export for AI to extract a formatted <strong>Markdown (.md)</strong> Knowledge Base. It's ready to be stored in your Obsidian/Notion vault or analyzed by ChatGPT and Claude!</li>
        `
};