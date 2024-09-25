class ChessClock {
    constructor(initialTime, onTimeOut) {
        // initialTime in seconds
        this.time = {
            w: initialTime, // White's remaining time
            b: initialTime  // Black's remaining time
        };
        this.currentTurn = 'w'; // 'w' or 'b'
        this.intervalId = null;
        this.onTimeOut = onTimeOut; // Callback when time runs out

        // DOM Elements
        this.whiteClockElement = document.getElementById('whiteClock');
        this.blackClockElement = document.getElementById('blackClock');
    }

    start() {
        // Start the clock for the current turn
        this.intervalId = setInterval(() => {
            this.time[this.currentTurn]--;

            // Update the display
            this.updateDisplay();

            // Check for time out
            if (this.time[this.currentTurn] <= 0) {
                clearInterval(this.intervalId);
                this.onTimeOut(this.currentTurn);
            }
        }, 1000); // Update every second
    }

    switchTurn() {
        // Switch the turn and restart the clock
        this.currentTurn = this.currentTurn === 'w' ? 'b' : 'w';
        this.updateDisplay();
    }

    pause() {
        // Pause the clock
        clearInterval(this.intervalId);
    }

    resume() {
        // Resume the clock for the current turn
        this.start();
    }

    reset(initialTime) {
        // Reset the clock to the initial time
        this.time.w = initialTime;
        this.time.b = initialTime;
        this.currentTurn = 'w';
        this.updateDisplay();
    }

    updateDisplay() {
        // Format time as mm:ss
        const formatTime = (seconds) => {
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };

        // Update the clock displays
        this.whiteClockElement.textContent = formatTime(this.time.w);
        this.blackClockElement.textContent = formatTime(this.time.b);

        // Highlight the active player's clock
        if (this.currentTurn === 'w') {
            this.whiteClockElement.classList.add('active');
            this.blackClockElement.classList.remove('active');
        } else {
            this.whiteClockElement.classList.remove('active');
            this.blackClockElement.classList.add('active');
        }
    }
}
