/* ===============================
   PROJECT DASHBOARD SCRIPT
   =============================== */

const API_BASE_URL = "http://localhost:5000";

const PROJECT_DASHBOARD_API = (id) =>
  `${API_BASE_URL}/api/projects/${id}/dashboard`;
const PROJECT_CHAT_API = (id) =>
  `${API_BASE_URL}/api/projects/${id}/chat`;
const MEMBER_DETAIL_API = (projectId, memberId) =>
  `${API_BASE_URL}/api/projects/${projectId}/members/${memberId}/detail`;


/* ---------- AUTH & URL ---------- */
const token = localStorage.getItem("token");
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get("projectId");

/* ---------- ROLE ---------- */
const currentUserRole =
  document.body.getAttribute("data-role") || "MEMBER";

/* ---------- ELEMENTS ---------- */
const projectTitleEl = document.getElementById("projectTitle");
const projectSublineEl = document.getElementById("projectSubline");
const projectStatusBadge = document.getElementById("projectStatusBadge");
const projectCompletionBar = document.getElementById("projectCompletionBar");
const projectCompletionLabel = document.getElementById("projectCompletionLabel");

const statTotalTasks = document.getElementById("statTotalTasks");
const statCompletedTasks = document.getElementById("statCompletedTasks");
const statOverdueTasks = document.getElementById("statOverdueTasks");
const statActiveMembers = document.getElementById("statActiveMembers");
const statAvgProgress = document.getElementById("statAvgProgress");

const projectStartDate = document.getElementById("projectStartDate");
const projectDeadline = document.getElementById("projectDeadline");
const projectDaysRemaining = document.getElementById("projectDaysRemaining");
const projectLastUpdated = document.getElementById("projectLastUpdated");
const currentUserRoleBadge = document.getElementById("currentUserRoleBadge");

const memberProgressBody = document.getElementById("memberProgressBody");
const taskBoardBody = document.getElementById("taskBoardBody");
const filterAssignee = document.getElementById("filterAssignee");
const filterStatus = document.getElementById("filterStatus");

const chatMessagesEl = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

/* ---------- STATE ---------- */
let dashboardData = null;
let allTasks = [];
let allMembers = [];
let chatMessages = [];

/* ---------- HELPERS ---------- */
function setRoleBadge(role) {
  currentUserRoleBadge.textContent = role.replace("_", " ");
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d) ? "—" : d.toLocaleDateString();
}

function calcDaysRemaining(deadline) {
  if (!deadline) return "—";
  const diff = new Date(deadline) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + " days";
}

function setStatusPill(status) {
  projectStatusBadge.textContent = status || "ACTIVE";
}

/* ---------- LOAD DASHBOARD ---------- */
async function loadDashboard() {
  if (!projectId || !token) {
    projectSublineEl.textContent = "Invalid project or login expired.";
    return;
  }

  try {
    const res = await fetch(PROJECT_DASHBOARD_API(projectId), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Dashboard fetch failed");

    dashboardData = await res.json();

    const { project = {}, stats = {}, tasks = [], members = [], chat = [] } =
      dashboardData;

    allTasks = tasks;
    allMembers = members;
    chatMessages = chat;

    projectTitleEl.textContent = project.title || "Project";
    projectSublineEl.textContent = project.description || "";
    setStatusPill(project.status);

    projectStartDate.textContent = formatDate(project.startDate);
    projectDeadline.textContent = formatDate(project.deadline);
    projectDaysRemaining.textContent = calcDaysRemaining(project.deadline);
    projectLastUpdated.textContent =
      "Updated: " + formatDate(project.lastUpdated);

    const completion = stats.completionPercent || 0;
    projectCompletionBar.style.width = completion + "%";
    projectCompletionLabel.textContent = completion + "%";

    statTotalTasks.textContent = stats.totalTasks || 0;
    statCompletedTasks.textContent = stats.completedTasks || 0;
    statOverdueTasks.textContent = stats.overdueTasks || 0;
    statActiveMembers.textContent =
      stats.activeMembers || members.length;
    statAvgProgress.textContent = (stats.avgProgress || 0) + "%";

    renderMembers();
    fillFilters();
    renderTasks();
    renderChatMessages();
  } catch (err) {
    console.error(err);
    projectSublineEl.textContent = "Failed to load dashboard data.";
  }
}

/* ---------- MEMBERS ---------- */
function renderMembers() {
  memberProgressBody.innerHTML = "";

  allMembers.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.name || m.email}</td>
      <td>${(m.role || "MEMBER").replace("_", " ")}</td>
      <td>${m.progressPercent || 0}%</td>
      <td>${m.doneTasks || 0} / ${m.totalTasks || 0}</td>
      <td>${m.overdueTasks || 0}</td>
    `;
    memberProgressBody.appendChild(tr);
  });
}

/* ---------- TASKS ---------- */
function fillFilters() {
  filterAssignee.innerHTML = `<option value="">All Members</option>`;
  allMembers.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.name || m.email;
    filterAssignee.appendChild(opt);
  });
}

function renderTasks() {
  const assignee = filterAssignee.value;
  const status = filterStatus.value;

  taskBoardBody.innerHTML = "";
  allTasks
    .filter((t) => {
      if (assignee && String(t.assigneeId) !== assignee) return false;
      if (status && t.status !== status) return false;
      return true;
    })
    .forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.title}</td>
        <td>${t.assigneeName || ""}</td>
        <td>${t.status || "TODO"}</td>
        <td>${formatDate(t.deadline)}</td>
        <td>${formatDate(t.lastUpdate)}</td>
      `;
      taskBoardBody.appendChild(tr);
    });
}

/* ---------- CHAT ---------- */
function renderChatMessages() {
  chatMessagesEl.innerHTML = "";

  const myUserId = localStorage.getItem("userId"); 
  // ⚠️ store userId in login once

  chatMessages.forEach((msg) => {
    const isMine = msg.senderId === myUserId;

    const wrapper = document.createElement("div");
    wrapper.className = isMine
      ? "chat-row chat-right"
      : "chat-row chat-left";

    const bubble = document.createElement("div");
    bubble.className = isMine
      ? "chat-bubble mine"
      : "chat-bubble";

    bubble.innerHTML = `
      ${
        !isMine
          ? `<div class="chat-sender">${msg.senderName}</div>`
          : ""
      }
      <div class="chat-text">${msg.message}</div>
      <div class="chat-time">
        ${new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    `;

    wrapper.appendChild(bubble);
    chatMessagesEl.appendChild(wrapper);
  });

  // ✅ Auto scroll like WhatsApp
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

async function loadChatOnly() {
  const res = await fetch(PROJECT_CHAT_API(projectId), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return;
  chatMessages = await res.json();
  renderChatMessages();
}

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text || !projectId) return;
  chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(
      `http://localhost:5000/api/projects/${projectId}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔥 REQUIRED
        },
        body: JSON.stringify({ message: text }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("Chat send failed:", err);
      return;
    }

    chatInput.value = "";
    loadChatOnly(); // reload messages
  } catch (err) {
    console.error("Chat error:", err);
  }
}

/* ---------- EVENTS ---------- */
filterAssignee.addEventListener("change", renderTasks);
filterStatus.addEventListener("change", renderTasks);
chatSendBtn.addEventListener("click", sendChatMessage);

/* ---------- INIT ---------- */
window.addEventListener("DOMContentLoaded", () => {
  setRoleBadge(currentUserRole);
  loadDashboard();
  setInterval(loadChatOnly, 10000);
});
