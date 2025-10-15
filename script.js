// Countdown Timer Application
class CountdownApp {
    constructor() {
        this.countdowns = JSON.parse(localStorage.getItem("countdowns")) || [];
        this.isAdmin = localStorage.getItem("isAdmin") === "true";
        this.editingId = null;
        this.adminPassword = "admin123"; // Change this to your desired password
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderCountdowns();
        this.updateAdminUI();
        this.startTimer();
        this.updateParisTime();
    }

    bindEvents() {
        // Admin toggle
        document.getElementById("adminToggle").addEventListener("click", () => {
            if (!this.isAdmin) {
                this.showLoginModal();
            } else {
                this.toggleAdminPanel();
            }
        });

        // Login form
        document.getElementById("loginForm").addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Countdown form
        document.getElementById("countdownForm").addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleCountdownSubmit();
        });

        // Cancel edit
        document.getElementById("cancelEdit").addEventListener("click", () => {
            this.cancelEdit();
        });

        // Close modal on outside click
        document.getElementById("loginModal").addEventListener("click", (e) => {
            if (e.target.id === "loginModal") {
                this.hideLoginModal();
            }
        });
    }

    showLoginModal() {
        document.getElementById("loginModal").classList.add("show");
        document.getElementById("password").focus();
    }

    hideLoginModal() {
        document.getElementById("loginModal").classList.remove("show");
        document.getElementById("password").value = "";
    }

    handleLogin() {
        const password = document.getElementById("password").value;
        if (password === this.adminPassword) {
            this.isAdmin = true;
            localStorage.setItem("isAdmin", "true");
            this.hideLoginModal();
            this.updateAdminUI();
            this.toggleAdminPanel();
        } else {
            alert("Incorrect password!");
            document.getElementById("password").value = "";
        }
    }

    logout() {
        this.isAdmin = false;
        localStorage.removeItem("isAdmin");
        this.updateAdminUI();
        this.hideAdminPanel();
    }

    updateAdminUI() {
        const adminToggle = document.getElementById("adminToggle");
        if (this.isAdmin) {
            adminToggle.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            adminToggle.onclick = () => this.logout();
        } else {
            adminToggle.innerHTML = '<i class="fas fa-cog"></i> Admin';
            adminToggle.onclick = () => this.showLoginModal();
        }
    }

    toggleAdminPanel() {
        const panel = document.getElementById("adminPanel");
        panel.classList.toggle("hidden");
    }

    hideAdminPanel() {
        document.getElementById("adminPanel").classList.add("hidden");
    }

    handleCountdownSubmit() {
        const name = document.getElementById("countdownName").value.trim();
        const date = document.getElementById("countdownDate").value;
        const color = document.getElementById("countdownColor").value;

        if (!name || !date) {
            alert("Please fill in all fields!");
            return;
        }

        const targetDate = new Date(date);
        if (targetDate <= new Date()) {
            alert("Target date must be in the future!");
            return;
        }

        const countdown = {
            id: this.editingId || Date.now().toString(),
            name,
            targetDate: targetDate.toISOString(),
            color,
            createdAt: this.editingId ? this.countdowns.find(c => c.id === this.editingId).createdAt : new Date().toISOString()
        };

        if (this.editingId) {
            const index = this.countdowns.findIndex(c => c.id === this.editingId);
            this.countdowns[index] = countdown;
            this.cancelEdit();
        } else {
            this.countdowns.push(countdown);
        }

        this.saveCountdowns();
        this.renderCountdowns();
        this.resetForm();
    }

    cancelEdit() {
        this.editingId = null;
        this.resetForm();
        document.getElementById("cancelEdit").classList.add("hidden");
        document.querySelector("#countdownForm button[type='submit']").innerHTML = '<i class="fas fa-plus"></i> Add Countdown';
    }

    resetForm() {
        document.getElementById("countdownForm").reset();
    }

    editCountdown(id) {
        const countdown = this.countdowns.find(c => c.id === id);
        if (!countdown) return;

        this.editingId = id;
        document.getElementById("countdownName").value = countdown.name;
        document.getElementById("countdownDate").value = new Date(countdown.targetDate).toISOString().slice(0, 16);
        document.getElementById("countdownColor").value = countdown.color;
        
        document.getElementById("cancelEdit").classList.remove("hidden");
        document.querySelector("#countdownForm button[type='submit']").innerHTML = '<i class="fas fa-save"></i> Update Countdown';
        
        // Scroll to form
        document.getElementById("adminPanel").scrollIntoView({ behavior: "smooth" });
    }

    deleteCountdown(id) {
        if (confirm("Are you sure you want to delete this countdown?")) {
            this.countdowns = this.countdowns.filter(c => c.id !== id);
            this.saveCountdowns();
            this.renderCountdowns();
        }
    }

    saveCountdowns() {
        localStorage.setItem("countdowns", JSON.stringify(this.countdowns));
    }

    renderCountdowns() {
        const container = document.getElementById("countdownsList");
        const emptyState = document.getElementById("emptyState");

        if (this.countdowns.length === 0) {
            container.innerHTML = "";
            emptyState.classList.remove("hidden");
            return;
        }

        emptyState.classList.add("hidden");
        container.innerHTML = this.countdowns.map(countdown => this.createCountdownHTML(countdown)).join("");
    }

    createCountdownHTML(countdown) {
        const now = new Date();
        const target = new Date(countdown.targetDate);
        
        // Convert to Paris time (CET/CEST)
        const parisTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Paris"}));
        const targetParisTime = new Date(target.toLocaleString("en-US", {timeZone: "Europe/Paris"}));
        
        const timeLeft = target - now;

        if (timeLeft <= 0) {
            return `
                <div class="countdown-card ${countdown.color}">
                    <div class="countdown-header">
                        <h3 class="countdown-name">${this.escapeHtml(countdown.name)}</h3>
                        ${this.isAdmin ? `
                            <div class="countdown-actions">
                                <button class="btn btn-small btn-secondary" onclick="app.editCountdown('${countdown.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-small btn-danger" onclick="app.deleteCountdown('${countdown.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ""}
                    </div>
                    <div class="countdown-expired">
                        <i class="fas fa-check-circle"></i> Time's up!
                    </div>
                    <div class="countdown-target">
                        Target: ${target.toLocaleString("en-GB", {timeZone: "Europe/Paris", timeZoneName: "short"})}
                    </div>
                </div>
            `;
        }

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        return `
            <div class="countdown-card ${countdown.color}">
                <div class="countdown-header">
                    <h3 class="countdown-name">${this.escapeHtml(countdown.name)}</h3>
                    ${this.isAdmin ? `
                        <div class="countdown-actions">
                            <button class="btn btn-small btn-secondary" onclick="app.editCountdown('${countdown.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-small btn-danger" onclick="app.deleteCountdown('${countdown.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ""}
                </div>
                <div class="countdown-timer">
                    <div class="time-unit">
                        <div class="time-value">${days}</div>
                        <div class="time-label">Days</div>
                    </div>
                    <div class="time-unit">
                        <div class="time-value">${hours}</div>
                        <div class="time-label">Hours</div>
                    </div>
                    <div class="time-unit">
                        <div class="time-value">${minutes}</div>
                        <div class="time-label">Minutes</div>
                    </div>
                    <div class="time-unit">
                        <div class="time-value">${seconds}</div>
                        <div class="time-label">Seconds</div>
                    </div>
                </div>
                <div class="countdown-target">
                    Target: ${target.toLocaleString("en-GB", {timeZone: "Europe/Paris", timeZoneName: "short"})}
                </div>
            </div>
        `;
    }

    startTimer() {
        setInterval(() => {
            this.renderCountdowns();
            this.updateParisTime();
        }, 1000);
    }

    updateParisTime() {
        const now = new Date();
        const parisTime = now.toLocaleString("en-GB", {
            timeZone: "Europe/Paris",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
        
        const parisTimeElement = document.getElementById("parisTime");
        if (parisTimeElement) {
            parisTimeElement.textContent = parisTime;
        }
    }

    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
const app = new CountdownApp();
