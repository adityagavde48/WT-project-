// ===== CONFIG =====
const API_BASE_URL = "http://localhost:5000";
const PROJECT_DETAILS_API = (id) => `${API_BASE_URL}/api/projects/${id}`;
const PROJECT_SETUP_API = (id) =>
  `${API_BASE_URL}/api/projects/${id}/manager-setup`;

const token = localStorage.getItem("token");

// ===== URL PARAM =====
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get("projectId");

// ===== ELEMENTS =====
const stepLabel = document.getElementById("stepLabel");
const step1Indicator = document.getElementById("step1Indicator");
const step2Indicator = document.getElementById("step2Indicator");
const step1Panel = document.getElementById("step1");
const step2Panel = document.getElementById("step2");

const alertContainer = document.getElementById("alertContainer");

const titleDisplay = document.getElementById("projectTitleDisplay");
const descriptionDisplay = document.getElementById(
  "projectDescriptionDisplay"
);
const fileLink = document.getElementById("projectFileLink");
const titleFixed = document.getElementById("projectTitleFixed");

const goToStep2Btn = document.getElementById("goToStep2Btn");
const backToStep1Btn = document.getElementById("backToStep1Btn");
const submitSetupBtn = document.getElementById("submitSetupBtn");

const memberEmailInput = document.getElementById("memberEmailInput");
const addMemberBtn = document.getElementById("addMemberBtn");
const teamList = document.getElementById("teamList");
const projectDeadlineInput = document.getElementById(
  "projectDeadlineInput"
);

const taskTitleInput = document.getElementById("taskTitleInput");
const taskDescriptionInput = document.getElementById(
  "taskDescriptionInput"
);
const taskAssigneeInput = document.getElementById("taskAssigneeInput");
const taskDeadlineInput = document.getElementById("taskDeadlineInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const tasksTableBody = document.querySelector("#tasksTable tbody");

// ===== STATE =====
let projectData = null;
let teamMembers = [];
let tasks = [];

// ===== HELPERS =====
function showAlert(message, type = "error") {
  alertContainer.innerHTML = "";
  const div = document.createElement("div");
  div.className =
    type === "error"
      ? "alert alert-danger"
      : "alert alert-success";
  div.textContent = message;
  alertContainer.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

function switchToStep(step) {
  if (step === 1) {
    step1Panel.classList.add("active");
    step2Panel.classList.remove("active");
    step1Indicator.classList.add("active");
    step2Indicator.classList.remove("active");
    stepLabel.textContent = "Step 1 of 2";
  } else {
    step1Panel.classList.remove("active");
    step2Panel.classList.add("active");
    step1Indicator.classList.remove("active");
    step2Indicator.classList.add("active");
    stepLabel.textContent = "Step 2 of 2";
  }
}

// ===== LOAD PROJECT =====
async function loadProjectDetails() {
  try {
    const res = await fetch(PROJECT_DETAILS_API(projectId), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error();

    projectData = await res.json();
    titleDisplay.textContent = projectData.title;
    descriptionDisplay.textContent = projectData.description;
    titleFixed.textContent = projectData.title;

    if (projectData.requirementFileUrl) {
      fileLink.href = projectData.requirementFileUrl;
    } else {
      fileLink.textContent = "No file available";
    }
  } catch {
    showAlert("Failed to load project");
  }
}

// ===== TEAM =====
function refreshTeamUI() {
  teamList.innerHTML = "";
  taskAssigneeInput.innerHTML =
    `<option value="">Select member</option>`;

  teamMembers.forEach((m, i) => {
    const li = document.createElement("li");
    li.className = "list-group-item text-light bg-transparent";

    li.innerHTML = `
      ${m.email}
      <span class="badge ms-2 ${
        m.role === "SCRUM_MASTER" ? "bg-warning" : "bg-info"
      }">${m.role.replace("_", " ")}</span>
      <button class="btn btn-sm btn-danger float-end">X</button>
    `;

    li.querySelector("button").onclick = () => {
      teamMembers.splice(i, 1);
      if (teamMembers.length > 0) {
        teamMembers[0].role = "SCRUM_MASTER";
        teamMembers.slice(1).forEach(
          (x) => (x.role = "TEAM_MEMBER")
        );
      }
      refreshTeamUI();
    };

    teamList.appendChild(li);

    const opt = document.createElement("option");
    opt.value = m.email;
    opt.textContent = m.email;
    taskAssigneeInput.appendChild(opt);
  });
}

function addMember() {
  const email = memberEmailInput.value.trim();
  if (!email || !email.includes("@"))
    return showAlert("Invalid email");

  if (teamMembers.some((m) => m.email === email))
    return showAlert("Already added");

  teamMembers.push({
    email,
    role:
      teamMembers.length === 0
        ? "SCRUM_MASTER"
        : "TEAM_MEMBER",
  });

  memberEmailInput.value = "";
  refreshTeamUI();
}

// ===== TASKS =====
function refreshTasksUI() {
  tasksTableBody.innerHTML = "";
  tasks.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${t.title}</td>
      <td>${t.assigneeEmail}</td>
      <td>${t.deadline || "-"}</td>
      <td><button class="btn btn-sm btn-danger">X</button></td>
    `;
    tr.querySelector("button").onclick = () => {
      tasks.splice(i, 1);
      refreshTasksUI();
    };
    tasksTableBody.appendChild(tr);
  });
}

function addTask() {
  const title = taskTitleInput.value.trim();
  const assignee = taskAssigneeInput.value;
  if (!title || !assignee)
    return showAlert("Task + assignee required");

  tasks.push({
    title,
    description: taskDescriptionInput.value,
    assigneeEmail: assignee,
    deadline: taskDeadlineInput.value || null,
  });

  taskTitleInput.value = "";
  taskDescriptionInput.value = "";
  taskAssigneeInput.value = "";
  taskDeadlineInput.value = "";
  refreshTasksUI();
}

// ===== SUBMIT =====
async function submitSetup() {
  try {
    const res = await fetch(PROJECT_SETUP_API(projectId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        teamMembers,
        tasks,
        projectDeadline: projectDeadlineInput.value || null,
      }),
    });

   const data = await res.json();
if (!res.ok) throw new Error(data.message);

showAlert("Setup completed & team notified", "success");

// ✅ ADD THESE LINES (AFTER SUCCESS MESSAGE)
setTimeout(() => {
  window.location.href = "dashboard.html";
}, 1500);


    showAlert("Setup completed & team notified", "success");
  } catch (e) {
    showAlert(e.message || "Setup failed");
  }
}

// ===== EVENTS =====
window.onload = loadProjectDetails;
goToStep2Btn.onclick = () => switchToStep(2);
backToStep1Btn.onclick = () => switchToStep(1);
addMemberBtn.onclick = addMember;
addTaskBtn.onclick = addTask;
submitSetupBtn.onclick = submitSetup;
