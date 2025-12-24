// ===== CONFIG =====
const API_BASE_URL = ""; // e.g. "http://localhost:8080"
const SPRINT_REVIEW_API = (projectId, sprintId) =>
  `${API_BASE_URL}/api/projects/${projectId}/sprints/${sprintId}/review`;
const SPRINT_FEEDBACK_API = (projectId, sprintId) =>
  `${API_BASE_URL}/api/projects/${projectId}/sprints/${sprintId}/feedback`;

// ===== URL PARAMS =====
const urlParams = new URLSearchParams(window.location.search);
const urlSprintId = urlParams.get("sprintId");

// ===== ELEMENTS & STATE =====
const bodyEl = document.body;
const role = bodyEl.getAttribute("data-role") || "MEMBER";
const projectId = bodyEl.getAttribute("data-project-id");
const username = bodyEl.getAttribute("data-username") || "User";

const noAccessBox = document.getElementById("noAccessBox");
const sprintContentWrapper = document.getElementById("sprintContentWrapper");

const projectTitleEl = document.getElementById("projectTitle");
const breadcrumbLine = document.getElementById("breadcrumbLine");
const roleBadge = document.getElementById("roleBadge");
const sprintSelect = document.getElementById("sprintSelect");
const sprintSmallInfo = document.getElementById("sprintSmallInfo");

// Sprint summary
const sprintNameHeading = document.getElementById("sprintNameHeading");
const sprintGoalEl = document.getElementById("sprintGoal");
const sprintStatusPill = document.getElementById("sprintStatusPill");
const sprintStartDateEl = document.getElementById("sprintStartDate");
const sprintEndDateEl = document.getElementById("sprintEndDate");
const sprintDaysRemainingEl = document.getElementById("sprintDaysRemaining");
const sprintProgressBar = document.getElementById("sprintProgressBar");
const sprintProgressLabel = document.getElementById("sprintProgressLabel");
const sprintPlannedTasksEl = document.getElementById("sprintPlannedTasks");
const sprintCompletedTasksEl = document.getElementById("sprintCompletedTasks");
const sprintInProgressTasksEl = document.getElementById("sprintInProgressTasks");
const sprintBlockedTasksEl = document.getElementById("sprintBlockedTasks");

// Health
const sprintHealthStatusEl = document.getElementById("sprintHealthStatus");
const sprintVelocityEl = document.getElementById("sprintVelocity");
const managerNotesInput = document.getElementById("managerNotesInput");
const saveNotesBtn = document.getElementById("saveNotesBtn");

// Member table
const memberTableBody = document.getElementById("memberTableBody");

// Feedback
const feedbackList = document.getElementById("feedbackList");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackMemberSelect = document.getElementById("feedbackMemberSelect");
const feedbackTaskInput = document.getElementById("feedbackTaskInput");
const feedbackCommentInput = document.getElementById("feedbackCommentInput");
const feedbackStatusSelect = document.getElementById("feedbackStatusSelect");
const feedbackMessage = document.getElementById("feedbackMessage");

// Sprint tasks
const sprintTaskBody = document.getElementById("sprintTaskBody");
const taskStatusFilter = document.getElementById("taskStatusFilter");
const taskFeedbackFilter = document.getElementById("taskFeedbackFilter");

// Project summary
const projectCompletionLabel = document.getElementById("projectCompletionLabel");
const projectCompletionBar = document.getElementById("projectCompletionBar");
const projectTotalSprints = document.getElementById("projectTotalSprints");
const projectCurrentSprintNumber = document.getElementById(
  "projectCurrentSprintNumber"
);
const projectTotalTasks = document.getElementById("projectTotalTasks");
const projectCompletedTasks = document.getElementById("projectCompletedTasks");
const backToProjectBtn = document.getElementById("backToProjectBtn");

// State
let reviewData = null;
let allSprints = [];
let currentSprint = null;
let members = [];
let tasks = [];
let feedbackItems = [];

// ===== HELPERS =====
function formatDate(str) {
  if (!str) return "—";
  try {
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString();
  } catch {
    return str;
  }
}

function formatDateTime(str) {
  if (!str) return "—";
  try {
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleString();
  } catch {
    return str;
  }
}

function calcDaysRemaining(deadlineStr) {
  if (!deadlineStr) return "—";
  const now = new Date();
  const d = new Date(deadlineStr);
  if (isNaN(d)) return "—";
  const diff = d - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} days`;
}

function showFeedbackMessage(msg, isError = false) {
  feedbackMessage.textContent = msg;
  feedbackMessage.style.color = isError ? "#fecaca" : "#bbf7d0";
  setTimeout(() => {
    feedbackMessage.textContent = "";
  }, 2500);
}

// ===== ACCESS CONTROL =====
function hasAccess() {
  return (
    role === "MANAGER" || role === "OWNER" || role === "SCRUM_MASTER"
  );
}

// ===== LOAD DATA =====
async function loadSprintReview() {
  if (!projectId || !urlSprintId) {
    breadcrumbLine.textContent =
      "Missing projectId or sprintId in the URL (?projectId=...&sprintId=...).";
    return;
  }

  try {
    const res = await fetch(SPRINT_REVIEW_API(projectId, urlSprintId), {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      breadcrumbLine.textContent = "Failed to load sprint review data.";
      return;
    }

    reviewData = await res.json();

    const p = reviewData.project || {};
    projectTitleEl.textContent = p.title || "Project";
    breadcrumbLine.textContent = `Project Overview • Sprint Review`;

    allSprints = reviewData.allSprints || [];
    currentSprint = reviewData.sprint || null;
    members = reviewData.members || [];
    tasks = reviewData.tasks || [];
    feedbackItems = reviewData.feedback || [];

    renderSprints();
    renderSprintSummary();
    renderMembers();
    renderFeedbackList();
    renderTasks();
    renderProjectSummary();
    loadManagerNotes();
  } catch (err) {
    console.error(err);
    breadcrumbLine.textContent = "Error loading sprint review.";
  }
}

// ===== RENDER: Sprint selector =====
function renderSprints() {
  sprintSelect.innerHTML = `<option value="">Select Sprint</option>`;
  allSprints.forEach((sp) => {
    const opt = document.createElement("option");
    opt.value = sp.id;
    opt.textContent = sp.name || `Sprint ${sp.id}`;
    sprintSelect.appendChild(opt);
  });

  if (currentSprint) {
    sprintSelect.value = currentSprint.id;
    sprintSmallInfo.textContent = `Reviewing ${currentSprint.name || ""}`;
  } else {
    sprintSmallInfo.textContent = "Choose a sprint to review.";
  }
}

// ===== RENDER: Sprint summary =====
function renderSprintSummary() {
  if (!currentSprint) {
    sprintNameHeading.textContent = "No sprint selected";
    return;
  }

  const sp = currentSprint;
  const percent =
    sp.completionPercent != null ? sp.completionPercent : 0;

  sprintNameHeading.textContent = sp.name || "Sprint";
  sprintGoalEl.textContent =
    sp.goal || "No sprint goal text returned from backend.";
  sprintStatusPill.textContent = (sp.status || "ACTIVE").replace("_", " ");

  sprintStartDateEl.textContent = formatDate(sp.startDate);
  sprintEndDateEl.textContent = formatDate(sp.endDate);
  sprintDaysRemainingEl.textContent = calcDaysRemaining(sp.endDate);

  sprintProgressBar.style.width = `${percent}%`;
  sprintProgressLabel.textContent = `${percent}%`;

  sprintPlannedTasksEl.textContent = sp.plannedTasks || 0;
  sprintCompletedTasksEl.textContent = sp.completedTasks || 0;
  sprintInProgressTasksEl.textContent = sp.inProgressTasks || 0;
  sprintBlockedTasksEl.textContent = sp.blockedTasks || 0;

  sprintHealthStatusEl.textContent =
    sp.healthStatus || sp.status || "—";
  sprintVelocityEl.textContent =
    sp.velocity != null ? sp.velocity : "—";
}

// ===== RENDER: Members =====
function renderMembers() {
  memberTableBody.innerHTML = "";

  if (!members.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.classList.add("tiny-label", "text-center");
    td.textContent = "No member sprint data.";
    tr.appendChild(td);
    memberTableBody.appendChild(tr);
    return;
  }

  // fill dropdown for feedback
  feedbackMemberSelect.innerHTML =
    `<option value="">Select member</option>`;
  members.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.name || m.email || `Member ${m.id}`;
    feedbackMemberSelect.appendChild(opt);
  });

  members.forEach((m) => {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = m.name || m.email || "-";

    const tdRole = document.createElement("td");
    tdRole.textContent = (m.role || "").replace("_", " ");

    const tdTasks = document.createElement("td");
    tdTasks.textContent = `${m.doneTasks || 0} / ${m.totalTasks || 0}`;

    const tdUploads = document.createElement("td");
    tdUploads.textContent = m.uploadCount || 0;

    const tdFeedback = document.createElement("td");
    tdFeedback.textContent = m.feedbackStatus || "—";

    tr.appendChild(tdName);
    tr.appendChild(tdRole);
    tr.appendChild(tdTasks);
    tr.appendChild(tdUploads);
    tr.appendChild(tdFeedback);

    memberTableBody.appendChild(tr);
  });
}

// ===== RENDER: Feedback list =====
function renderFeedbackList() {
  feedbackList.innerHTML = "";

  if (!feedbackItems.length) {
    const div = document.createElement("div");
    div.classList.add("tiny-label");
    div.textContent = "No feedback yet. Add a new feedback item.";
    feedbackList.appendChild(div);
    return;
  }

  feedbackItems.forEach((f) => {
    const item = document.createElement("div");
    item.classList.add("feedback-item");

    const meta = document.createElement("div");
    meta.classList.add("feedback-meta");
    meta.textContent = `${f.memberName || "Member"} • ${
      f.taskTitle || f.area || "General"
    } • ${formatDateTime(f.updatedAt || f.createdAt)}`;

    const comment = document.createElement("div");
    comment.classList.add("feedback-comment");
    comment.textContent = f.comment || "";

    const status = document.createElement("span");
    status.classList.add(
      "feedback-status-pill",
      f.status === "RESOLVED"
        ? "feedback-resolved"
        : f.status === "IN_PROGRESS"
        ? "feedback-in-progress"
        : "feedback-open"
    );
    status.textContent = (f.status || "OPEN").replace("_", " ");

    item.appendChild(meta);
    item.appendChild(comment);
    item.appendChild(status);

    feedbackList.appendChild(item);
  });
}

// ===== RENDER: Tasks =====
function renderTasks() {
  sprintTaskBody.innerHTML = "";

  const statusFilterVal = taskStatusFilter.value;
  const feedbackFilterVal = taskFeedbackFilter.value;

  const withFeedbackTaskIds = new Set(
    feedbackItems
      .filter((f) => f.status !== "RESOLVED")
      .map((f) => f.taskId)
      .filter(Boolean)
  );

  const filtered = tasks.filter((t) => {
    if (statusFilterVal && t.status !== statusFilterVal) return false;
    if (feedbackFilterVal === "WITH_FEEDBACK") {
      return withFeedbackTaskIds.has(t.id);
    }
    return true;
  });

  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.classList.add("tiny-label", "text-center");
    td.textContent = "No sprint tasks match the selected filters.";
    tr.appendChild(td);
    sprintTaskBody.appendChild(tr);
    return;
  }

  filtered.forEach((t) => {
    const tr = document.createElement("tr");

    const tdTitle = document.createElement("td");
    tdTitle.textContent = t.title || "-";

    const tdAssignee = document.createElement("td");
    tdAssignee.textContent = t.assigneeName || "-";

    const tdStatus = document.createElement("td");
    tdStatus.textContent = t.status || "TODO";

    const tdPoints = document.createElement("td");
    tdPoints.textContent = t.storyPoints != null ? t.storyPoints : "-";

    const tdPriority = document.createElement("td");
    tdPriority.textContent = t.priority || "-";

    const tdUpdate = document.createElement("td");
    tdUpdate.textContent = formatDateTime(t.lastUpdate);

    tr.appendChild(tdTitle);
    tr.appendChild(tdAssignee);
    tr.appendChild(tdStatus);
    tr.appendChild(tdPoints);
    tr.appendChild(tdPriority);
    tr.appendChild(tdUpdate);

    sprintTaskBody.appendChild(tr);
  });
}

// ===== RENDER: Project summary =====
function renderProjectSummary() {
  const p = reviewData?.project || {};
  const completion = p.completionPercent || 0;

  projectCompletionBar.style.width = `${completion}%`;
  projectCompletionLabel.textContent = `${completion}%`;

  projectTotalSprints.textContent = p.totalSprints || 0;
  projectCurrentSprintNumber.textContent =
    p.currentSprintNumber || currentSprint?.sequence || "—";
  projectTotalTasks.textContent = p.totalTasks || 0;
  projectCompletedTasks.textContent = p.completedTasks || 0;
}

// ===== LOCAL STORAGE: Manager notes =====
function notesKey() {
  return `sprint-notes-${projectId}-${urlSprintId}`;
}

function saveManagerNotes() {
  localStorage.setItem(notesKey(), managerNotesInput.value);
}

function loadManagerNotes() {
  const val = localStorage.getItem(notesKey());
  if (val) managerNotesInput.value = val;
}

// ===== EVENTS =====

// sprint selector: navigate to another sprint
sprintSelect.addEventListener("change", () => {
  const val = sprintSelect.value;
  if (!val) return;
  const params = new URLSearchParams(window.location.search);
  params.set("sprintId", val);
  window.location.search = params.toString();
});

// filters
taskStatusFilter.addEventListener("change", renderTasks);
taskFeedbackFilter.addEventListener("change", renderTasks);

// feedback form
feedbackForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!projectId || !urlSprintId) return;

  const memberId = feedbackMemberSelect.value;
  const taskTitle = feedbackTaskInput.value.trim();
  const comment = feedbackCommentInput.value.trim();
  const status = feedbackStatusSelect.value;

  if (!memberId || !comment) {
    showFeedbackMessage("Select member and write feedback.", true);
    return;
  }

  const payload = {
    memberId,
    taskTitle,
    comment,
    status,
  };

  try {
    // If you don't have backend yet, comment this fetch out and push directly.
    const res = await fetch(SPRINT_FEEDBACK_API(projectId, urlSprintId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      showFeedbackMessage("Failed to save feedback (backend).", true);
      return;
    }

    const created = await res.json();
    feedbackItems.unshift(created);
    renderFeedbackList();
    showFeedbackMessage("Feedback added.");
    feedbackForm.reset();
  } catch (err) {
    console.error(err);
    showFeedbackMessage("Error connecting to server.", true);
  }
});

// manager notes
if (saveNotesBtn) {
  saveNotesBtn.addEventListener("click", () => {
    saveManagerNotes();
  });
}

// back button
backToProjectBtn.addEventListener("click", () => {
  // You can change this to a fixed URL like `/projects/${projectId}/overview`
  if (window.history.length > 1) {
    window.history.back();
  }
});

// INIT
window.addEventListener("DOMContentLoaded", () => {
  // role badge
  roleBadge.textContent = role.replace("_", " ");

  if (!hasAccess()) {
    noAccessBox.classList.remove("d-none");
    sprintContentWrapper.classList.add("d-none");
    return;
  }

  noAccessBox.classList.add("d-none");
  sprintContentWrapper.classList.remove("d-none");

  loadSprintReview();
});
