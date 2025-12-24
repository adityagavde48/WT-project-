// ---------- Helpers ----------
function initialsFromName(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ---------- Render user ----------
function renderUser(user) {
  const initials = initialsFromName(user.name);

  document.getElementById("topAvatar").textContent = initials;
  document.getElementById("sidebarAvatar").textContent = initials;

  document.getElementById("topUserName").textContent = user.name || "";
  document.getElementById("sidebarUserName").textContent = user.name || "";
  document.getElementById("sidebarUserEmail").textContent = user.email || "";
}

// ---------- Render summary ----------
function renderSummary(summary) {
  document.getElementById("summaryActive").textContent =
    summary?.activeProjects ?? 0;
  document.getElementById("summaryTasks").textContent =
    summary?.myTasks ?? 0;
  document.getElementById("summaryDeadlines").textContent =
    summary?.upcomingDeadlines ?? 0;
}

// ---------- Render projects ----------
function renderProjects(projects = []) {
  const list = document.getElementById("projectsList");
  const side = document.getElementById("sidebarProjects");

  list.innerHTML = "";
  side.innerHTML = "";

  projects.forEach((p) => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-xl-4";

    const card = document.createElement("div");
    card.className = "nt-project-card h-100";
    card.dataset.projectId = p.id;

    // ✅ OPEN PROJECT DASHBOARD
  card.addEventListener("click", (e) => {
  if (e.target.closest(".delete-project-btn")) return;

  if (p.role === "OWNER" || p.role === "MANAGER") {
    window.location.href = `project-dashboard.html?projectId=${p.id}`;
  } else {
    window.location.href = `member-dashboard.html?projectId=${p.id}`;
  }
});



    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <h6 class="mb-1">${p.title}</h6>
          <p class="text-muted small mb-2">${p.description || ""}</p>
        </div>
        <div class="d-flex gap-2">
          <span class="nt-role-pill">${p.role}</span>
          ${
            p.role === "OWNER"
              ? `<button class="btn btn-sm btn-danger delete-project-btn"
                   data-project-id="${p.id}">
                   Delete
                 </button>`
              : ""
          }
        </div>
      </div>

      <div class="small text-muted mb-1">Progress</div>
      <div class="nt-progress-bar mb-1">
        <div class="nt-progress-fill" style="width:${p.progress || 0}%"></div>
      </div>
    `;

    col.appendChild(card);
    list.appendChild(col);

    // sidebar scroll
    const li = document.createElement("li");
    li.textContent = p.title;
    li.addEventListener("click", () => {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    side.appendChild(li);
  });
}

// ---------- Render analytics ----------
function renderAnalytics(managerAnalytics = []) {
  const section = document.getElementById("analyticsSection");
  const grid = document.getElementById("analyticsGrid");
  const tab = document.getElementById("analyticsTab");

  if (!managerAnalytics.length) {
    section.classList.add("d-none");
    tab.classList.add("d-none");
    return;
  }

  section.classList.remove("d-none");
  tab.classList.remove("d-none");
  grid.innerHTML = "";

  managerAnalytics.forEach((a) => {
    const total = (a.open || 0) + (a.inProgress || 0) + (a.done || 0);
    const donePercent = total ? Math.round((a.done / total) * 100) : 0;

    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-xl-4";

    const card = document.createElement("div");
    card.className = "nt-analytics-card h-100";
    card.innerHTML = `
      <h6>${a.title}</h6>
      <p class="small text-muted">${a.description || ""}</p>
      <div class="nt-progress-bar">
        <div class="nt-progress-fill" style="width:${donePercent}%"></div>
      </div>
    `;

    col.appendChild(card);
    grid.appendChild(col);
  });
}

// ---------- Notifications ----------
// ================= NOTIFICATION LOGIC (FULL & FIXED) =================

// wait until DOM is ready (VERY IMPORTANT)
window.addEventListener("DOMContentLoaded", () => {
  const notifPanel = document.getElementById("notifPanel");
  const notifBtn = document.getElementById("notifBtn");
  const closeNotif = document.getElementById("closeNotif");
  const notificationsContainer =
    document.getElementById("notificationsContainer");

  // safety check
  if (!notifPanel || !notifBtn || !notificationsContainer) {
    console.error("Notification elements missing in DOM");
    return;
  }

  // ---------- Load notifications ----------
  async function loadNotifications() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log("📡 Loading notifications...");

      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Notification API failed");
        return;
      }

      const notifications = await res.json();
      renderNotifications(notifications);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }

  // ---------- Open notification panel ----------
  notifBtn.addEventListener("click", () => {
    notifPanel.classList.add("active");
    loadNotifications(); // ✅ REQUEST FIRES HERE
  });

  // ---------- Close notification panel ----------
  closeNotif.addEventListener("click", () => {
    notifPanel.classList.remove("active");
  });

  // ---------- Accept / Reject handler ----------
// ---------- Accept / Reject handler ----------
// ---------- Notification Accept / Reject (FINAL & CORRECT) ----------
notificationsContainer.addEventListener("click", async (e) => {
  const btn = e.target;

  if (
    !btn.classList.contains("accept-btn") &&
    !btn.classList.contains("reject-btn")
  ) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  const li = btn.closest("li");
  const projectId = btn.dataset.projectId;
  const type = btn.dataset.type; // 🔥 project-invite | team-add
  const token = localStorage.getItem("token");
  const isAccept = btn.classList.contains("accept-btn");

  if (!projectId || !type) {
    console.error("Missing projectId or type");
    return;
  }

  // 🔐 Disable buttons immediately (prevents double click)
  li.querySelectorAll("button").forEach((b) => {
    b.disabled = true;
    b.textContent = "Processing...";
  });

  // 🎯 Decide backend action
  let action = "";

  if (type === "project-invite") {
    action = isAccept ? "accept" : "reject";          // manager
  } else if (type === "team-add") {
    action = isAccept ? "team/accept" : "team/reject"; // member
  }

  try {
    const res = await fetch(
      `http://localhost:5000/api/projects/${projectId}/${action}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Action failed");

      // re-enable buttons if failed
      li.querySelectorAll("button").forEach((b) => {
        b.disabled = false;
        b.textContent = b.classList.contains("accept-btn")
          ? "Accept"
          : "Reject";
      });
      return;
    }

    // ✅ Redirect if backend tells where to go
    if (data.redirect) {
      window.location.href = data.redirect;
      return;
    }

    // ✅ Otherwise just reload dashboard
    loadDashboard();
  } catch (err) {
    console.error("Notification action error:", err);
  }
});



});
function renderNotifications(notifications = []) {
  const container = document.getElementById("notificationsContainer");
  container.innerHTML = "";

  if (!notifications.length) {
    container.innerHTML = `
      <li class="list-group-item text-center text-muted">
        No notifications
      </li>`;
    return;
  }

  notifications.forEach((n) => {
    const li = document.createElement("li");

    let buttons = "";
    if (n.type === "project-invite" || n.type === "team-add") {
      buttons = `
        <div class="mt-2 d-flex gap-2">
          <button
  class="btn btn-sm btn-success accept-btn"
  data-project-id="${n.projectId}"
  data-type="${n.type}"
>
  Accept
</button>

<button
  class="btn btn-sm btn-danger reject-btn"
  data-project-id="${n.projectId}"
  data-type="${n.type}"
>
  Reject
</button>

        </div>
      `;
    }

    li.className = "list-group-item";
    li.innerHTML = `
      <div>${n.message}</div>
      <small class="text-muted">
        ${new Date(n.createdAt).toLocaleString()}
      </small>
      ${buttons}
    `;

    container.appendChild(li);
  });
}

// ---------- Load dashboard ----------
async function loadDashboard() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const data = await res.json();

    renderUser(data.user || {});
    renderSummary(data.summary || {});
    renderProjects(data.projects || []);
    renderAnalytics(data.managerAnalytics || []);
    renderNotifications(data.notifications || []);
  } catch (err) {
    console.error("Dashboard load failed", err);
  }
}

// ---------- Init ----------
window.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
    return;
  }

  loadDashboard();

  // ✅ CREATE PROJECT
  document.getElementById("newProjectBtn")?.addEventListener("click", () => {
    window.location.href = "create-project.html";
  });

  document
    .getElementById("summaryNewProjectBtn")
    ?.addEventListener("click", () => {
      window.location.href = "create-project.html";
    });

  // ✅ PROFILE
  document.getElementById("profileBtn")?.addEventListener("click", () => {
    window.location.href = "profile.html";
  });

  // ✅ SETTINGS
  document.getElementById("settingsBtn")?.addEventListener("click", () => {
    window.location.href = "settings.html";
  });
});

// ---------- DELETE PROJECT (OWNER ONLY) ----------
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-project-btn")) return;

  e.preventDefault();
  e.stopPropagation();

  const projectId = e.target.dataset.projectId;
  const token = localStorage.getItem("token");

  if (!confirm("Are you sure you want to delete this project?")) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/projects/${projectId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      alert("Delete failed");
      return;
    }

    alert("Project deleted");
    loadDashboard();
  } catch (err) {
    alert("Error deleting project");
  }
});
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});
