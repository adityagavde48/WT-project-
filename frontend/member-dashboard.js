// ================= CONFIG =================
const API_BASE_URL = "http://localhost:5000";

const MEMBER_DASHBOARD_API = (projectId) =>
  `${API_BASE_URL}/api/projects/${projectId}/member/dashboard`;

const MEMBER_UPLOADS_API = (projectId) =>
  `${API_BASE_URL}/api/projects/${projectId}/member/uploads`;

const MEMBER_CHAT_API = (projectId) =>
  `${API_BASE_URL}/api/projects/${projectId}/chat`;

// ================= STATE =================
let projectId = null;
let memberName = "Member";
const token = localStorage.getItem("token");

// ================= ELEMENTS =================
const projectTitleEl = document.getElementById("projectTitle");
const projectSublineEl = document.getElementById("projectSubline");
const memberNameLabel = document.getElementById("memberNameLabel");

const statTotalUploads = document.getElementById("statTotalUploads");
const statTodayUploads = document.getElementById("statTodayUploads");
const statLastUpload = document.getElementById("statLastUpload");

const sprintLabelInput = document.getElementById("sprintLabelInput");
const noteInput = document.getElementById("noteInput");
const fileInput = document.getElementById("fileInput");
const uploadForm = document.getElementById("uploadForm");
const uploadAlert = document.getElementById("uploadAlert");
const uploadTableBody = document.getElementById("uploadTableBody");

const chatMessagesEl = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

const summaryInput = document.getElementById("summaryInput");
const saveSummaryBtn = document.getElementById("saveSummaryBtn");

// ================= HELPERS =================
function formatDateTime(str) {
  if (!str) return "—";
  const d = new Date(str);
  return isNaN(d) ? "—" : d.toLocaleString();
}

function showUploadAlert(msg, type = "info") {
  uploadAlert.textContent = msg;
  uploadAlert.style.color =
    type === "error" ? "#fecaca" : "#a7f3d0";
}

// ================= LOAD DASHBOARD =================
async function loadMemberDashboard() {
  if (!projectId) return;

  try {
    const res = await fetch(MEMBER_DASHBOARD_API(projectId), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      projectSublineEl.textContent = "Failed to load dashboard";
      return;
    }

    const data = await res.json();
    console.log("✅ DASHBOARD DATA:", data);

    projectTitleEl.textContent = data.project?.title || "Project";
    projectSublineEl.textContent = data.project?.description || "";
    memberNameLabel.textContent = `Hi, ${memberName}`;

    statTotalUploads.textContent = data.stats?.totalUploads || 0;
    statTodayUploads.textContent = data.stats?.todayUploads || 0;
    statLastUpload.textContent =
      formatDateTime(data.stats?.lastUploadAt);

    renderUploads(data.uploads || []);
    renderChatMessages(data.chat || []);
    loadSummaryFromLocal();

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

// ================= RENDER UPLOADS =================
function renderUploads(list) {
  uploadTableBody.innerHTML = "";

  if (!list.length) {
    uploadTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="tiny-label text-center">
          No uploads yet. Start by uploading your sprint work.
        </td>
      </tr>`;
    return;
  }

  list.forEach((u) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="${u.url}" target="_blank">${u.fileName}</a></td>
      <td>${u.sprintLabel || "—"}</td>
      <td>${u.note || "—"}</td>
      <td>${formatDateTime(u.uploadedAt)}</td>
      <td>✔</td>
    `;
    uploadTableBody.appendChild(tr);
  });
}

// ================= UPLOAD =================
async function handleUpload(e) {
  e.preventDefault();

  if (!fileInput.files.length) {
    showUploadAlert("Please choose a file", "error");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("sprintLabel", sprintLabelInput.value.trim());
  formData.append("note", noteInput.value.trim());

  try {
    const res = await fetch(MEMBER_UPLOADS_API(projectId), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      showUploadAlert(err.message || "Upload failed", "error");
      return;
    }

    showUploadAlert("Upload successful!");
    uploadForm.reset();
    loadMemberDashboard();

  } catch {
    showUploadAlert("Server error", "error");
  }
}
let chatMessages = [];
const myUserId = localStorage.getItem("userId");


// ================= CHAT =================
function renderChatMessages() {
  chatMessagesEl.innerHTML = "";

  chatMessages.forEach((msg) => {
    const isMine = msg.senderId === myUserId;

    const row = document.createElement("div");
    row.className = `chat-row ${isMine ? "chat-right" : "chat-left"}`;

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${isMine ? "mine" : ""}`;

    bubble.innerHTML = `
      ${!isMine ? `<div class="chat-sender">${msg.senderName}</div>` : ""}
      <div>${msg.message}</div>
      <div class="chat-time">
        ${new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    `;

    row.appendChild(bubble);
    chatMessagesEl.appendChild(row);
  });

  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}


async function loadMemberChat() {
  try {
    const res = await fetch(
      `http://localhost:5000/api/projects/${projectId}/chat`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) return;

    chatMessages = await res.json();
    renderChatMessages();
  } catch (err) {
    console.error("Chat load error:", err);
  }
}

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/projects/${projectId}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      }
    );

    if (!res.ok) {
      console.error("Message send failed");
      return;
    }

    chatInput.value = "";
    loadMemberChat();
  } catch (err) {
    console.error("Send chat error:", err);
  }
}

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});


// ================= LOCAL SUMMARY =================
function saveSummaryToLocal() {
  localStorage.setItem(
    `member-summary-${projectId}`,
    summaryInput.value
  );
}

function loadSummaryFromLocal() {
  const val = localStorage.getItem(
    `member-summary-${projectId}`
  );
  if (val) summaryInput.value = val;
}

// ================= INIT (FIXED – SINGLE SOURCE OF TRUTH) =================
document.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    alert("Login required");
    window.location.href = "login.html";
    return;
  }

  // ✅ Read projectId ONCE
  projectId = document.body.getAttribute("data-project-id");
  memberName =
    document.body.getAttribute("data-member-name") || "Member";

  console.log("📌 projectId from body:", projectId);

  if (!projectId) {
    alert("Project ID missing. Open project from dashboard.");
    window.location.href = "dashboard.html";
    return;
  }

  // ✅ Attach events ONCE
  uploadForm.addEventListener("submit", handleUpload);
  chatSendBtn.addEventListener("click", sendChatMessage);
  saveSummaryBtn.addEventListener("click", saveSummaryToLocal);

  console.log("✅ MEMBER DASHBOARD READY:", projectId);

  // ✅ Load dashboard AFTER everything is ready
  loadMemberDashboard();
});
