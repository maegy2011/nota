/**
 * app/controllers/EventController.js
 *
 * This controller manages the state and actions for individual events.
 * It would be responsible for:
 * - Handling the creation of a new event (e.g., showing an event editor form).
 * - Handling the editing of an existing event.
 * - Interacting with the Event model to save or delete data.
 *
 * NOTE: This is a foundational structure. It would be expanded with methods
 * similar to notesController (e.g., createNewEvent, editEvent, saveEvent).
 */
function eventController() {
    return {
        // --- State ---
        isEditing: false,   // Toggles the event editor/form.
        activeEvent: null,  // The event object currently being edited.
        masterKey: null,    // The master encryption key.

        // --- Initialization ---
        init() {
            // Listen for the master key
            window.addEventListener('app-unlocked', (event) => {
                if (!this.masterKey) {
                    this.masterKey = event.detail.masterKey;
                }
            });
            // Listen for save/close events from the (hypothetical) event editor
        },

        // --- Actions ---
        /**
         * Opens the editor to create a new event.
         * @param {number} defaultDate - A timestamp for the default start date.
         */
        createNewEvent(defaultDate) {
            this.activeEvent = {
                id: null,
                title: '',
                description: '',
                startTime: defaultDate || Date.now(),
                isAllDay: false
            };
            this.isEditing = true;
        },

        /**
         * Opens the editor for an existing event.
         * @param {object} eventObject - The event to edit.
         */
        editEvent(eventObject) {
            this.activeEvent = { ...eventObject }; // Use a copy
            this.isEditing = true;
        },

        /**
         * Saves the event (new or existing) using the Event model.
         */
        async saveEvent() {
            if (!this.masterKey || !this.activeEvent) return;

            try {
                if (this.activeEvent.id) {
                    await Event.update(this.activeEvent.id, this.activeEvent, this.masterKey);
                } else {
                    await Event.create(this.activeEvent, this.masterKey);
                }
            } catch (error) {
                console.error("Failed to save event:", error);
            } finally {
                this.isEditing = false;
                // Dispatch an event to tell the CalendarController to reload events
                window.dispatchEvent(new CustomEvent('events-updated'));
            }
        },

        closeEditor() {
            this.isEditing = false;
            this.activeEvent = null;
        }
    };
}
