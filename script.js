// ---------- SAVED DATA ----------
const getSaved = (key, fallback) => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
};

let tasks = getSaved("studyspaceTasks", []);
let exams = getSaved("studyspaceExams", []);
let plans = getSaved("studyspacePlans", []);
let focusSessions = getSaved("studyspaceFocusSessions", 0);
let currentFilter = "all";

function saveData() {
    localStorage.setItem("studyspaceTasks", JSON.stringify(tasks));
    localStorage.setItem("studyspaceExams", JSON.stringify(exams));
    localStorage.setItem("studyspacePlans", JSON.stringify(plans));
    localStorage.setItem("studyspaceFocusSessions", JSON.stringify(focusSessions));
}

// ---------- DATE ----------
const today = new Date();

document.getElementById("todayDate").textContent =
    today.toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function daysUntil(dateString) {
    const target = new Date(dateString + "T00:00:00");
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return Math.ceil((target - current) / 86400000);
}

// ---------- NAVIGATION ----------
const pageInfo = {
    dashboard: ["YOUR PERSONAL STUDY SPACE", "Welcome back.", "Make today count. One task at a time."],
    tasks: ["GET THINGS DONE", "My tasks.", "Keep your priorities clear and manageable."],
    planner: ["PLAN WITH PURPOSE", "Your planner.", "Give your study sessions a place in your day."],
    exams: ["STAY PREPARED", "Exam tracker.", "Know what's coming and prepare ahead."],
    focus: ["TIME TO CONCENTRATE", "Focus room.", "Put distractions aside and focus on one thing."],
    analytics: ["YOUR PROGRESS", "Study analytics.", "Small steps become meaningful progress."],
    settings: ["PERSONALISE YOUR SPACE", "Settings.", "Manage your StudySpace data."]
};

function openPage(pageName) {
    if (!pageInfo[pageName]) return;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.toggle("active", page.id === pageName);
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.page === pageName);
    });

    const [eyebrow, title, subtitle] = pageInfo[pageName];
    document.getElementById("pageEyebrow").textContent = eyebrow;
    document.getElementById("pageTitle").textContent = title;
    document.getElementById("pageSubtitle").textContent = subtitle;
}

document.querySelectorAll(".nav-link[data-page]").forEach(link => {
    link.addEventListener("click", () => openPage(link.dataset.page));
});

document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.goto));
});

// ---------- TASKS ----------
function addTask(value) {
    const text = value.trim();
    if (!text) return;

    tasks.push({
        text,
        completed: false,
        createdAt: new Date().toISOString()
    });

    saveData();
    renderAll();
}

function createTaskElement(task, index) {
    const item = document.createElement("li");
    item.className = `task-item ${task.completed ? "done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark task complete");

    checkbox.addEventListener("change", () => {
        tasks[index].completed = checkbox.checked;
        saveData();
        renderAll();
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", "Delete task");

    deleteButton.addEventListener("click", () => {
        tasks.splice(index, 1);
        saveData();
        renderAll();
    });

    item.append(checkbox, text, deleteButton);
    return item;
}

function renderTaskList(listId, emptyId, limit = Infinity) {
    const list = document.getElementById(listId);
    const empty = document.getElementById(emptyId);
    list.innerHTML = "";

    let visibleTasks = tasks.map((task, index) => ({ task, index }));

    if (listId === "fullTaskList") {
        if (currentFilter === "active") {
            visibleTasks = visibleTasks.filter(item => !item.task.completed);
        } else if (currentFilter === "completed") {
            visibleTasks = visibleTasks.filter(item => item.task.completed);
        }
    }

    visibleTasks = visibleTasks.slice(0, limit);

    visibleTasks.forEach(({ task, index }) => {
        list.appendChild(createTaskElement(task, index));
    });

    empty.style.display = visibleTasks.length ? "none" : "block";
}

document.getElementById("taskForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById("taskInput");
    addTask(input.value);
    input.value = "";
    input.focus();
});

document.getElementById("taskFormFull").addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById("taskInputFull");
    addTask(input.value);
    input.value = "";
    input.focus();
});

document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        document.querySelectorAll("[data-filter]").forEach(filter => {
            filter.classList.toggle("active", filter === button);
        });

        renderTaskList("fullTaskList", "fullTaskEmpty");
    });
});

// ---------- EXAMS ----------
document.getElementById("examForm").addEventListener("submit", event => {
    event.preventDefault();

    const subject = document.getElementById("examSubject").value.trim();
    const date = document.getElementById("examDate").value;

    if (!subject || !date) return;

    exams.push({
        subject,
        date,
        id: Date.now()
    });

    exams.sort((a, b) => a.date.localeCompare(b.date));

    saveData();
    renderAll();
    event.target.reset();
});

function renderExams() {
    const list = document.getElementById("examList");
    const preview = document.getElementById("dashboardExams");
    const empty = document.getElementById("examPageEmpty");
    const previewEmpty = document.getElementById("examEmpty");

    list.innerHTML = "";
    preview.innerHTML = "";

    const upcoming = exams
        .filter(exam => daysUntil(exam.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date));

    upcoming.forEach(exam => {
        const days = daysUntil(exam.date);
        const card = document.createElement("div");
        card.className = "list-card";

        const details = document.createElement("div");
        const subject = document.createElement("strong");
        subject.textContent = exam.subject;
        const date = document.createElement("small");
        date.textContent = formatDate(exam.date);
        details.append(subject, date);

        const actions = document.createElement("div");
        actions.className = "item-actions";

        const countdown = document.createElement("span");
        countdown.className = "countdown";
        countdown.textContent = days === 0 ? "Today" : `${days} days left`;

        const remove = document.createElement("button");
        remove.className = "delete-button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Delete exam");
        remove.addEventListener("click", () => {
            exams = exams.filter(item => item.id !== exam.id);
            saveData();
            renderAll();
        });

        actions.append(countdown, remove);
        card.append(details, actions);
        list.appendChild(card);
    });

    empty.style.display = upcoming.length ? "none" : "block";
    previewEmpty.style.display = upcoming.length ? "none" : "block";

    upcoming.slice(0, 3).forEach(exam => {
        const card = document.createElement("div");
        card.className = "list-card";

        const details = document.createElement("div");
        const subject = document.createElement("strong");
        subject.textContent = exam.subject;
        const date = document.createElement("small");
        date.textContent = formatDate(exam.date);
        details.append(subject, date);

        const countdown = document.createElement("span");
        countdown.className = "countdown";
        const days = daysUntil(exam.date);
        countdown.textContent = days === 0 ? "Today" : `${days} days left`;

        card.append(details, countdown);
        preview.appendChild(card);
    });

    document.getElementById("examCount").textContent = upcoming.length;
}

// ---------- PLANNER ----------
document.getElementById("plannerForm").addEventListener("submit", event => {
    event.preventDefault();

    const title = document.getElementById("planTitle").value.trim();
    const date = document.getElementById("planDate").value;
    const time = document.getElementById("planTime").value;

    if (!title || !date || !time) return;

    plans.push({ title, date, time, id: Date.now() });
    plans.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    saveData();
    renderPlans();
    event.target.reset();
});

function renderPlans() {
    const list = document.getElementById("plannerList");
    const empty = document.getElementById("plannerEmpty");
    list.innerHTML = "";

    const sortedPlans = [...plans].sort((a, b) =>
        (a.date + a.time).localeCompare(b.date + b.time)
    );

    sortedPlans.forEach(plan => {
        const card = document.createElement("div");
        card.className = "list-card";

        const details = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = plan.title;
        const date = document.createElement("small");
        date.textContent = `${formatDate(plan.date)} · ${plan.time}`;
        details.append(title, date);

        const remove = document.createElement("button");
        remove.className = "delete-button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Delete study session");
        remove.addEventListener("click", () => {
            plans = plans.filter(item => item.id !== plan.id);
            saveData();
            renderPlans();
        });

        card.append(details, remove);
        list.appendChild(card);
    });

    empty.style.display = sortedPlans.length ? "none" : "block";
}

// ---------- FOCUS TIMER ----------
let selectedMinutes = 25;
let remainingSeconds = selectedMinutes * 60;
let timerInterval = null;
let timerRunning = false;

const timerDisplay = document.getElementById("timerDisplay");
const timerStart = document.getElementById("timerStart");
const timerStatus = document.getElementById("timerStatus");

function updateTimerDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    timerStart.textContent = "Start";
}

function startTimer() {
    if (timerRunning) {
        stopTimer();
        timerStatus.textContent = "Timer paused.";
        return;
    }

    if (remainingSeconds <= 0) {
        remainingSeconds = selectedMinutes * 60;
    }

    timerRunning = true;
    timerStart.textContent = "Pause";
    timerStatus.textContent = "Stay focused. You've got this.";

    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateTimerDisplay();

        if (remainingSeconds <= 0) {
            stopTimer();
            focusSessions++;
            saveData();
            renderAll();
            timerStatus.textContent = "Session complete. Take a short break.";
            alert("Focus session complete!");
        }
    }, 1000);
}

timerStart.addEventListener("click", startTimer);

document.getElementById("timerReset").addEventListener("click", () => {
    stopTimer();
    remainingSeconds = selectedMinutes * 60;
    updateTimerDisplay();
    timerStatus.textContent = "Timer reset. Ready when you are.";
});

document.querySelectorAll("[data-minutes]").forEach(button => {
    button.addEventListener("click", () => {
        stopTimer();
        selectedMinutes = Number(button.dataset.minutes);
        remainingSeconds = selectedMinutes * 60;
        updateTimerDisplay();

        document.querySelectorAll("[data-minutes]").forEach(preset => {
            preset.classList.toggle("active", preset === button);
        });

        timerStatus.textContent = `${selectedMinutes}-minute session selected.`;
    });
});

// ---------- ANALYTICS & DASHBOARD ----------
function updateStats() {
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    document.getElementById("completedCount").innerHTML =
        `${completed} <small>/ ${total}</small>`;

    document.getElementById("progressPercent").textContent = `${percent}%`;
    document.getElementById("progressDetail").textContent =
        `${completed} of ${total} tasks`;

    document.getElementById("progressRing").style.background =
        `conic-gradient(var(--brown-light) ${percent * 3.6}deg, #45382f 0deg)`;

    document.getElementById("progressMessage").textContent =
        total === 0 ? "Start with one small task." :
        percent === 100 ? "Everything is complete. Well done." :
        `${total - completed} task${total - completed === 1 ? "" : "s"} left to go.`;

    document.getElementById("focusCount").textContent = focusSessions;
    document.getElementById("analyticsTotal").textContent = total;
    document.getElementById("analyticsCompleted").textContent = completed;
    document.getElementById("analyticsFocus").textContent = focusSessions;
    document.getElementById("analyticsBar").style.width = `${percent}%`;

    document.getElementById("analyticsMessage").textContent =
        total === 0 ? "Add tasks to start tracking your progress." :
        `${percent}% of your tasks are complete.`;
}

function renderAll() {
    renderTaskList("taskList", "taskEmpty", 5);
    renderTaskList("fullTaskList", "fullTaskEmpty");
    renderExams();
    renderPlans();
    updateStats();
}

// ---------- SETTINGS ----------
document.getElementById("clearData").addEventListener("click", () => {
    const confirmed = confirm(
        "This will permanently delete your saved tasks, exams, planner entries and focus count. Continue?"
    );

    if (!confirmed) return;

    tasks = [];
    exams = [];
    plans = [];
    focusSessions = 0;

    saveData();
    renderAll();
    stopTimer();
    selectedMinutes = 25;
    remainingSeconds = 25 * 60;
    updateTimerDisplay();

    timerStatus.textContent = "Your data has been cleared.";
});

// ---------- INITIAL DISPLAY ----------
renderAll();
updateTimerDisplay();