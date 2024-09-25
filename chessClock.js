// chessClock.js

class ChessClock {
    constructor(initialTime, onTimeOut) {
        // initialTime in seconds
        this.initialTime = initialTime; // Store the initial time for resetting
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

        // Update the display initially
        this.updateDisplay();
    }

    start() {
        // Start the clock for the current turn
        if (this.intervalId) {
            clearInterval(this.intervalId); // Clear any existing interval
        }
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
        // Switch the turn
        this.currentTurn = this.currentTurn === 'w' ? 'b' : 'w';
        this.updateDisplay();
    }

    pause() {
        // Pause the clock
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    resume() {
        // Resume the clock for the current turn
        if (!this.intervalId) {
            this.start();
        }
    }

    reset() {
        // Reset the clock to the initial time
        this.time.w = this.initialTime;
        this.time.b = this.initialTime;
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

    editTime(color) {
        // Pause the clock if it's running
        const wasRunning = this.intervalId !== null;
        if (wasRunning) {
            this.pause();
        }

        // Prompt the user for a new time
        const currentFormattedTime = this.formatTime(this.time[color]);
        const newTimeStr = prompt(`Enter new time for ${color === 'w' ? 'White' : 'Black'} (mm:ss):`, currentFormattedTime);
        if (newTimeStr) {
            const timeParts = newTimeStr.split(':');
            if (timeParts.length === 2) {
                const minutes = parseInt(timeParts[0], 10);
                const seconds = parseInt(timeParts[1], 10);
                if (!isNaN(minutes) && !isNaN(seconds) && minutes >= 0 && seconds >= 0 && seconds < 60) {
                    const totalSeconds = minutes * 60 + seconds;
                    this.time[color] = totalSeconds;
                    this.updateDisplay();
                } else {
                    alert('Invalid time format. Please enter time as mm:ss with valid numbers.');
                }
            } else {
                alert('Invalid time format. Please enter time as mm:ss.');
            }
        }

        // Resume the clock if it was running
        if (wasRunning) {
            this.resume();
        }
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
}
