/**
 * app/controllers/NoteController.js
 *
 * This controller manages the state and actions for the notes view.
 * It's responsible for:
 * - Loading and decrypting notes from the Note model.
 * - Handling search and filtering.
 * - Managing the state for creating and editing notes (showing/hiding the editor).
 * - Interacting with the Note model to save or delete data.
 */
function notesController() {
    return {
        // --- State ---
        notes: [],          // The master list of all notes, loaded once.
        filteredNotes: [],  // The list of notes to be displayed after filtering.
        isLoading: true,    // Controls the visibility of the loading indicator.
        isEditing: false,   // Toggles the rich-text editor overlay.
        activeNote: null,   // The note object currently being edited or created.
        searchQuery: '',    // The current text in the search input.
        masterKey: null,    // The master encryption key, received after unlock.

        // --- Initialization ---
        init() {
            // This controller is initialized when its view is shown.
            // We need the masterKey to do anything, so we listen for the 'app-unlocked' event.
            window.addEventListener('app-unlocked', (event) => {
                if (!this.masterKey) { // Prevent re-loading if already initialized
                    console.log('Notes controller received master key.');
                    this.masterKey = event.detail.masterKey;
                    this.loadNotes();
                }
            });

            // Listen for events dispatched from the editor component
            window.addEventListener('save-note-request', (event) => this.saveNote(event.detail.note));
            window.addEventListener('close-editor-request', () => this.closeEditor());
        },

        // --- Data Actions ---
        async loadNotes() {
            if (!this.masterKey) return;
            this.isLoading = true;
            try {
                this.notes = await Note.findAll(this.masterKey);
                this.filterNotes(); // Apply initial (empty) filter
            } catch (error) {
                console.error("Failed to load notes:", error);
                // Optionally dispatch an event to show a global error message
            } finally {
                this.isLoading = false;
            }
        },

        async saveNote(noteData) {
            if (!this.masterKey) return;

            try {
                if (noteData.id) { // Existing note
                    await Note.update(noteData.id, noteData, this.masterKey);
                } else { // New note
                    await Note.create(noteData, this.masterKey);
                }
            } catch (error) {
                console.error("Failed to save note:", error);
            } finally {
                this.closeEditor();
                await this.loadNotes(); // Reload all notes to show changes
            }
        },

        async deleteNote(noteId) {
            // This could be called from a delete button in the editor or a swipe action
            if (!confirm('هل أنت متأكد من حذف هذه الملاحظة نهائياً؟')) return;

            try {
                await Note.delete(noteId);
            } catch (error) {
                console.error("Failed to delete note:", error);
            } finally {
                this.closeEditor();
                await this.loadNotes();
            }
        },

        // --- UI Actions ---
        createNewNote() {
            this.activeNote = { id: null, title: '', content: '', is_favorite: false };
            this.isEditing = true;
        },

        editNote(noteId) {
            const noteToEdit = this.notes.find(n => n.id === noteId);
            if (noteToEdit) {
                this.activeNote = { ...noteToEdit }; // Pass a copy to prevent live-binding issues
                this.isEditing = true;
            }
        },

        closeEditor() {
            this.isEditing = false;
            this.activeNote = null;
        },

        filterNotes() {
            if (!this.searchQuery) {
                this.filteredNotes = this.notes;
                return;
            }
            const query = this.searchQuery.toLowerCase();
            this.filteredNotes = this.notes.filter(note => {
                const content = note.content.replace(/<[^>]+>/g, ''); // Strip HTML for searching
                return note.title.toLowerCase().includes(query) || content.toLowerCase().includes(query);
            });
        }
    };
}
