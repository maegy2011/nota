/**
 * app/controllers/CalendarController.js
 *
 * This controller manages the state and actions for the main calendar view.
 * It's responsible for:
 * - Keeping track of the currently displayed month and year.
 * - Generating the grid of days for the current month.
 * - Fetching and decrypting events for the visible date range from the Event model.
 * - Handling navigation between months.
 */
function calendarController() {
    return {
        // --- State ---
        currentDate: new Date(), // The date object used to determine the month/year to display.
        days: [],                // An array of day objects for the current month's grid.
        events: [],              // A list of events for the currently displayed month.
        isLoading: true,
        masterKey: null,

        // --- Initialization ---
        init() {
            // Listen for the master key before doing anything
            window.addEventListener('app-unlocked', (event) => {
                if (!this.masterKey) {
                    this.masterKey = event.detail.masterKey;
                    this.generateCalendar();
                }
            });

            // Listen for the custom event dispatched when an event is saved or deleted
            window.addEventListener('events-updated', () => this.loadEventsForMonth());
        },

        // --- Calendar Logic ---
        generateCalendar() {
            this.isLoading = true;
            this.generateDaysForGrid();
            this.loadEventsForMonth();
            this.isLoading = false;
        },

        /**
         * Generates the array of day objects needed to render the calendar grid.
         * Includes days from the previous and next months to fill the grid.
         */
        generateDaysForGrid() {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            
            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);
            
            const daysInMonth = lastDayOfMonth.getDate();
            const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sunday, 1=Monday...

            const grid = [];
            
            // 1. Days from previous month
            const prevMonthLastDay = new Date(year, month, 0).getDate();
            for (let i = startDayOfWeek; i > 0; i--) {
                grid.push({
                    day: prevMonthLastDay - i + 1,
                    isCurrentMonth: false,
                    date: new Date(year, month - 1, prevMonthLastDay - i + 1)
                });
            }

            // 2. Days of the current month
            for (let i = 1; i <= daysInMonth; i++) {
                grid.push({
                    day: i,
                    isCurrentMonth: true,
                    isToday: new Date().toDateString() === new Date(year, month, i).toDateString(),
                    date: new Date(year, month, i)
                });
            }

            // 3. Days from next month
            const gridEnd = 42 - grid.length; // 6 rows * 7 days
            for (let i = 1; i <= gridEnd; i++) {
                grid.push({
                    day: i,
                    isCurrentMonth: false,
                    date: new Date(year, month + 1, i)
                });
            }
            
            this.days = grid;
        },

        /**
         * Fetches all events for the currently displayed month from the Event model.
         */
        async loadEventsForMonth() {
            if (!this.masterKey) return;

            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();

            const startDate = new Date(year, month, 1).getTime();
            const endDate = new Date(year, month + 1, 0, 23, 59, 59).getTime();

            try {
                this.events = await Event.findByDateRange(startDate, endDate, this.masterKey);
            } catch (error) {
                console.error("Failed to load events for month:", error);
                this.events = [];
            }
        },

        // --- UI Navigation ---
        nextMonth() {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.generateCalendar();
        },

        previousMonth() {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.generateCalendar();
        },

        goToToday() {
            this.currentDate = new Date();
            this.generateCalendar();
        },

        // --- Helpers ---
        get monthName() {
            return this.currentDate.toLocaleDateString('ar-EG', { month: 'long' });
        },
        get year() {
            return this.currentDate.getFullYear();
        }
    };
}
