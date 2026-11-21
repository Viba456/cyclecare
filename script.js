// State management
let currentData = {
  startDate: "2026-11-13",
  cycleLength: 28,
  periodLength: 5,
  cycleDay: 7,
  daysLeft: 22,
  nextPeriod: "2026-12-11",
  ovulation: "2026-11-27",
  fertileStart: "2026-11-22",
  fertileEnd: "2026-11-27",
};

// Daily symptoms logs stored in localStorage
const savedLogs = localStorage.getItem("cycle_daily_logs");
let dailyLogs = savedLogs ? JSON.parse(savedLogs) : {};

let viewYear = 2026;
let viewMonth = 10; // November (0-indexed)
let selectedDateStr = new Date().toISOString().split("T")[0];

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Phase Insights Knowledge Base
const phaseKnowledge = {
  menstrual: {
    banner: "<strong>Menstrual Phase (Days 1–5):</strong> Estrogen and progesterone are at their lowest levels. Your body is shedding the uterine lining and asks for gentle restoration, warmth, and rest.",
    nutrition: "Warm, iron-rich meals like lentils, spinach, bone broths, and dark chocolate. Drink soothing ginger or raspberry leaf tea for cramps.",
    movement: "Restorative yoga, gentle pelvic stretching, or relaxing walks. Avoid strenuous lifting or exhaustion.",
    selfcare: "Keep your lower abdomen warm with a hot water bag, get 8+ hours of deep sleep, and embrace low-pressure quiet time.",
    hormone: "Hormone levels are at baseline; physical energy is lowest, but your intuitive clarity and reflection are at their peak."
  },
  follicular: {
    banner: "<strong>Follicular Phase (Days 6–13):</strong> Estrogen begins its climb as follicles mature. You will feel an uptick in optimism, stamina, mental sharpness, and creativity.",
    nutrition: "Fresh vibrant salads, lean proteins, fermented foods (yogurt, kimchi), and pumpkin or flax seeds for healthy hormone synthesis.",
    movement: "Cardio, brisk running, hiking, and strength conditioning. Your muscles recover faster during this phase!",
    selfcare: "Great time to start new habits, brainstorm exciting projects, organize your space, and connect with friends.",
    hormone: "Rising estrogen boosts serotonin and dopamine, giving you brighter skin, high stamina, and positive mood."
  },
  ovulation: {
    banner: "<strong>Ovulatory Phase (Days 14–16):</strong> Peak estrogen and LH surge trigger the release of an egg. Fertility, confidence, verbal fluency, and magnetism are at their maximum.",
    nutrition: "Antioxidant-rich berries, leafy cruciferous veggies, hydrating foods (cucumbers, watermelon), and fiber to help metabolize estrogen.",
    movement: "High-intensity interval training (HIIT), heavy lifting, spin class, or dance workouts. You have maximum peak power.",
    selfcare: "Schedule important meetings, social gatherings, presentations, or romantic date nights. Your confidence shines brightest now.",
    hormone: "Estrogen and testosterone hit their monthly peak. High energy, heightened libido, and radiant complexion."
  },
  luteal: {
    banner: "<strong>Luteal Phase (Days 17–28):</strong> Progesterone takes over to support the uterine lining. As progesterone drops towards the end, PMS symptoms and cravings can emerge.",
    nutrition: "Complex carbs (roasted sweet potatoes, oats, quinoa), magnesium (almonds, pumpkin seeds), and avoid excess sodium or caffeine to curb bloating.",
    movement: "Moderate pilates, bodyweight sculpt, swimming, or moderate cycling. Listen to your fatigue cues.",
    selfcare: "Set gentle boundaries, minimize overcommitting, keep a bedtime ritual, and practice mindfulness to balance mood swings.",
    hormone: "Progesterone promotes calm initially, but its sharp drop before menstruation triggers PMS, bloating, and sugar cravings."
  }
};

// Fetch predictions from MongoDB backend or compute locally
async function fetchCycle() {
  try {
    const res = await fetch("/api/cycle");
    if (res.ok) {
      currentData = await res.json();
      console.log("✅ Loaded cycle from MongoDB:", currentData);
    } else {
      console.warn("⚠️ Using local predictions calculation.");
      computeLocalPredictions();
    }
  } catch (err) {
    console.warn("⚠️ Backend connection error, using local state:", err.message);
    computeLocalPredictions();
  }
  updateUI();
}

function computeLocalPredictions() {
  const start = new Date(currentData.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  currentData.cycleDay = diffDays >= 0 ? diffDays + 1 : 1;

  const nextP = new Date(start);
  nextP.setDate(nextP.getDate() + Number(currentData.cycleLength || 28));

  const ovul = new Date(nextP);
  ovul.setDate(ovul.getDate() - 14);

  const fert = new Date(ovul);
  fert.setDate(fert.getDate() - 5);

  const daysLeft = Math.round((nextP - today) / (1000 * 60 * 60 * 24));
  const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  currentData.daysLeft = daysLeft;
  currentData.nextPeriod = toYMD(nextP);
  currentData.ovulation = toYMD(ovul);
  currentData.fertileStart = toYMD(fert);
  currentData.fertileEnd = toYMD(ovul);
}

// Compute active phase
function getCurrentPhase() {
  const cDay = currentData.cycleDay || 1;
  const pLen = Number(currentData.periodLength) || 5;
  const cLen = Number(currentData.cycleLength) || 28;
  const ovDayNum = cLen - 14;

  if (cDay <= pLen) return "menstrual";
  if (cDay < ovDayNum - 1) return "follicular";
  if (cDay >= ovDayNum - 1 && cDay <= ovDayNum + 2) return "ovulation";
  return "luteal";
}

// Update the DOM elements
function updateUI() {
  const cycleDayEl = document.getElementById("cycleDay");
  const cycleBadgeEl = document.getElementById("cycleBadge");
  const countdownEl = document.getElementById("countdown");
  const nextPeriodEl = document.getElementById("nextPeriod");
  const ovulationEl = document.getElementById("ovulation");
  const fertileWindowEl = document.getElementById("fertileWindow");
  const cycleLenTextEl = document.getElementById("cycleLenText");

  if (cycleDayEl) cycleDayEl.innerText = currentData.cycleDay || 1;
  if (cycleBadgeEl) cycleBadgeEl.innerText = `Cycle Day ${currentData.cycleDay || 1}`;
  if (countdownEl) {
    countdownEl.innerText = currentData.daysLeft > 0 
      ? `Period in ${currentData.daysLeft} days` 
      : (currentData.daysLeft === 0 ? "Period due today!" : `Period was ${Math.abs(currentData.daysLeft)} days ago`);
  }

  if (nextPeriodEl) nextPeriodEl.innerText = currentData.nextPeriod || "-";
  if (ovulationEl) ovulationEl.innerText = currentData.ovulation || "-";
  if (fertileWindowEl) {
    fertileWindowEl.innerText = 
      `${currentData.fertileStart ? currentData.fertileStart.slice(5) : ""} to ${currentData.fertileEnd ? currentData.fertileEnd.slice(5) : ""}`;
  }
  if (cycleLenTextEl) cycleLenTextEl.innerText = `${currentData.cycleLength || 28} Days`;

  const inputStart = document.getElementById("inputStart");
  const inputCycle = document.getElementById("inputCycle");
  const inputPeriod = document.getElementById("inputPeriod");

  if (inputStart && currentData.startDate) inputStart.value = currentData.startDate;
  if (inputCycle && currentData.cycleLength) inputCycle.value = currentData.cycleLength;
  if (inputPeriod && currentData.periodLength) inputPeriod.value = currentData.periodLength;

  // Update Phase Insights
  const currentPhase = getCurrentPhase();
  const phaseLabels = {
    menstrual: "🩸 Menstrual Phase",
    follicular: "🌱 Follicular Phase",
    ovulation: "✨ Ovulation Phase",
    luteal: "🌙 Luteal Phase"
  };
  const currentPhaseTag = document.getElementById("currentPhaseTag");
  if (currentPhaseTag) {
    currentPhaseTag.innerText = `Current: ${phaseLabels[currentPhase]} (Day ${currentData.cycleDay || 1})`;
  }
  setPhaseTab(currentPhase);

  renderCalendar();
  loadLogForDate(selectedDateStr);
}

// Phase Tabs Interaction
function setPhaseTab(phaseKey) {
  document.querySelectorAll(".phase-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.phase === phaseKey);
  });

  const p = phaseKnowledge[phaseKey] || phaseKnowledge.menstrual;
  const banner = document.getElementById("phaseBanner");
  const nut = document.getElementById("insightNutrition");
  const mov = document.getElementById("insightMovement");
  const selfc = document.getElementById("insightSelfcare");
  const horm = document.getElementById("insightHormone");

  if (banner) banner.innerHTML = p.banner;
  if (nut) nut.innerText = p.nutrition;
  if (mov) mov.innerText = p.movement;
  if (selfc) selfc.innerText = p.selfcare;
  if (horm) horm.innerText = p.hormone;
}

document.querySelectorAll(".phase-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    setPhaseTab(btn.dataset.phase);
  });
});

// Render the 7-day grid calendar
function renderCalendar() {
  const monthTitle = document.getElementById("monthTitle");
  if (monthTitle) monthTitle.innerText = `${monthNames[viewMonth]} ${viewYear}`;

  const grid = document.getElementById("calendarGrid");
  if (!grid) return;
  grid.innerHTML = "";

  // Day names header
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d) => {
    const el = document.createElement("div");
    el.className = "weekday";
    el.innerText = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  // Empty leading days
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement("div");
    el.className = "cal-day empty";
    grid.appendChild(el);
  }

  // Days of month
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const el = document.createElement("div");
    el.className = "cal-day";
    el.innerText = day;
    el.dataset.date = dateStr;

    const start = new Date(currentData.startDate);
    const pEnd = new Date(start);
    pEnd.setDate(pEnd.getDate() + (currentData.periodLength || 5) - 1);

    const nextP = new Date(currentData.nextPeriod);
    const nextPEnd = new Date(nextP);
    nextPEnd.setDate(nextPEnd.getDate() + (currentData.periodLength || 5) - 1);

    const curr = new Date(dateStr);

    if (curr >= start && curr <= pEnd) el.classList.add("period");
    else if (curr >= nextP && curr <= nextPEnd) el.classList.add("predicted");
    else if (dateStr === currentData.ovulation) el.classList.add("ovulation");
    else if (dateStr >= currentData.fertileStart && dateStr <= currentData.fertileEnd) el.classList.add("fertile");

    if (dateStr === todayStr) el.classList.add("today");
    if (dateStr === selectedDateStr) el.classList.add("selected");

    // Check if symptoms logged on this date
    if (dailyLogs[dateStr] && (
      (dailyLogs[dateStr].moods && dailyLogs[dateStr].moods.length > 0) ||
      (dailyLogs[dateStr].symptoms && dailyLogs[dateStr].symptoms.length > 0) ||
      (dailyLogs[dateStr].flow && dailyLogs[dateStr].flow !== "none") ||
      (dailyLogs[dateStr].waterGlasses > 0)
    )) {
      const dot = document.createElement("span");
      dot.className = "cal-day-dot";
      el.appendChild(dot);
    }

    // Clicking a day opens that day in the logger
    el.addEventListener("click", () => {
      selectedDateStr = dateStr;
      const logInput = document.getElementById("logDateInput");
      if (logInput) logInput.value = dateStr;
      document.querySelectorAll(".cal-day").forEach(d => d.classList.remove("selected"));
      el.classList.add("selected");
      loadLogForDate(dateStr);
    });

    grid.appendChild(el);
  }
}

// Symptom & Mood Logger Logic
let currentLog = {
  flow: "none",
  moods: [],
  symptoms: [],
  waterGlasses: 4,
  notes: ""
};

function renderWaterTracker(glasses) {
  const container = document.getElementById("waterCupsContainer");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 1; i <= 8; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `cup-btn ${i <= glasses ? "filled" : ""}`;
    btn.innerText = "💧";
    btn.title = `Glass ${i}`;
    btn.addEventListener("click", () => {
      currentLog.waterGlasses = i;
      renderWaterTracker(i);
    });
    container.appendChild(btn);
  }

  const countEl = document.getElementById("waterCountText");
  const mlEl = document.getElementById("waterMlText");
  if (countEl) countEl.innerText = `${glasses} of 8 glasses logged`;
  if (mlEl) mlEl.innerText = `${glasses * 250} ml / 2,000 ml daily goal`;
}

function loadLogForDate(dateStr) {
  const log = dailyLogs[dateStr] || {
    flow: "none",
    moods: [],
    symptoms: [],
    waterGlasses: 4,
    notes: ""
  };

  currentLog = { ...log };

  const logInput = document.getElementById("logDateInput");
  if (logInput) logInput.value = dateStr;

  // Flow Pills
  document.querySelectorAll(".flow-pill").forEach(pill => {
    pill.classList.toggle("active", pill.dataset.flow === (currentLog.flow || "none"));
  });

  // Mood chips
  document.querySelectorAll("#moodGroup .chip").forEach(chip => {
    chip.classList.toggle("active", (currentLog.moods || []).includes(chip.dataset.mood));
  });

  // Symptom chips
  document.querySelectorAll("#symptomGroup .chip").forEach(chip => {
    chip.classList.toggle("active", (currentLog.symptoms || []).includes(chip.dataset.symptom));
  });

  // Water Tracker
  renderWaterTracker(currentLog.waterGlasses !== undefined ? currentLog.waterGlasses : 4);

  // Notes
  const notesEl = document.getElementById("logNotes");
  if (notesEl) notesEl.value = currentLog.notes || "";
}

// Flow selector listeners
document.querySelectorAll(".flow-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".flow-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    currentLog.flow = pill.dataset.flow;
  });
});

// Mood multi-select chips listeners
document.querySelectorAll("#moodGroup .chip").forEach(chip => {
  chip.addEventListener("click", () => {
    chip.classList.toggle("active");
    const mood = chip.dataset.mood;
    if (!currentLog.moods) currentLog.moods = [];
    if (chip.classList.contains("active")) {
      if (!currentLog.moods.includes(mood)) currentLog.moods.push(mood);
    } else {
      currentLog.moods = currentLog.moods.filter(m => m !== mood);
    }
  });
});

// Symptom multi-select chips listeners
document.querySelectorAll("#symptomGroup .chip").forEach(chip => {
  chip.addEventListener("click", () => {
    chip.classList.toggle("active");
    const symptom = chip.dataset.symptom;
    if (!currentLog.symptoms) currentLog.symptoms = [];
    if (chip.classList.contains("active")) {
      if (!currentLog.symptoms.includes(symptom)) currentLog.symptoms.push(symptom);
    } else {
      currentLog.symptoms = currentLog.symptoms.filter(s => s !== symptom);
    }
  });
});

// Water controls (+ / -)
const btnWaterAdd = document.getElementById("btnWaterAdd");
if (btnWaterAdd) {
  btnWaterAdd.addEventListener("click", () => {
    if ((currentLog.waterGlasses || 0) < 8) {
      currentLog.waterGlasses = (currentLog.waterGlasses || 0) + 1;
      renderWaterTracker(currentLog.waterGlasses);
    }
  });
}

const btnWaterSub = document.getElementById("btnWaterSub");
if (btnWaterSub) {
  btnWaterSub.addEventListener("click", () => {
    if ((currentLog.waterGlasses || 0) > 0) {
      currentLog.waterGlasses = (currentLog.waterGlasses || 0) - 1;
      renderWaterTracker(currentLog.waterGlasses);
    }
  });
}

// Date picker change
const logDateInput = document.getElementById("logDateInput");
if (logDateInput) {
  logDateInput.addEventListener("change", (e) => {
    selectedDateStr = e.target.value;
    loadLogForDate(selectedDateStr);
    renderCalendar();
  });
}

// Save Daily Log
const btnSaveLog = document.getElementById("btnSaveLog");
if (btnSaveLog) {
  btnSaveLog.addEventListener("click", () => {
    const notesEl = document.getElementById("logNotes");
    currentLog.notes = notesEl ? notesEl.value.trim() : "";
    dailyLogs[selectedDateStr] = { ...currentLog };
    localStorage.setItem("cycle_daily_logs", JSON.stringify(dailyLogs));

    const toast = document.getElementById("toastMsg");
    if (toast) {
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2500);
    }

    renderCalendar();
  });
}

// Clear / Reset Day's Log
const btnClearLog = document.getElementById("btnClearLog");
if (btnClearLog) {
  btnClearLog.addEventListener("click", () => {
    if (confirm(`Reset the log for ${selectedDateStr}?`)) {
      delete dailyLogs[selectedDateStr];
      localStorage.setItem("cycle_daily_logs", JSON.stringify(dailyLogs));
      loadLogForDate(selectedDateStr);
      renderCalendar();
    }
  });
}

// Save / update cycle to MongoDB backend
async function saveCycle(startDate, cycleLength, periodLength, source = "form_update") {
  const payload = {
    startDate,
    cycleLength: Number(cycleLength),
    periodLength: Number(periodLength),
    source,
  };

  try {
    const res = await fetch("/api/cycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      currentData = await res.json();
      console.log("✅ Successfully saved to MongoDB:", currentData);
      updateUI();
    } else {
      const err = await res.json();
      console.error("❌ Failed to save to MongoDB:", err.error || err);
      computeLocalPredictions();
      updateUI();
    }
  } catch (err) {
    console.warn("⚠️ Network error, updating local predictions:", err.message);
    currentData.startDate = startDate;
    currentData.cycleLength = Number(cycleLength);
    currentData.periodLength = Number(periodLength);
    computeLocalPredictions();
    updateUI();
  }
}

// Event Listeners
const cycleForm = document.getElementById("cycleForm");
if (cycleForm) {
  cycleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const start = document.getElementById("inputStart").value;
    const cycle = document.getElementById("inputCycle").value;
    const period = document.getElementById("inputPeriod").value;
    saveCycle(start, cycle, period, "form_update");
  });
}

const btnToday = document.getElementById("btnToday");
if (btnToday) {
  btnToday.addEventListener("click", () => {
    const todayStr = new Date().toISOString().split("T")[0];
    selectedDateStr = todayStr;
    saveCycle(todayStr, currentData.cycleLength || 28, currentData.periodLength || 5, "quick_button");
  });
}

const btnPrev = document.getElementById("btnPrev");
if (btnPrev) {
  btnPrev.addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    }
    renderCalendar();
  });
}

const btnNext = document.getElementById("btnNext");
if (btnNext) {
  btnNext.addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    renderCalendar();
  });
}

// Initial load
fetchCycle();
