// ===============================
// PROFILE PAGE SCRIPT
// ===============================

// Load profile data from backend
async function loadProfile() {
  try {
    const token = localStorage.getItem("token");

    // 🔐 Safety check
    if (!token) {
      console.error("No token found. Please login again.");
      return;
    }

    const res = await fetch("http://localhost:5000/api/profile", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Failed to load profile:", err);
      return;
    }

    const userProfile = await res.json();
    console.log("Profile loaded:", userProfile); // 🔍 Debug
    renderProfile(userProfile);

  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

// ===============================
// RENDER PROFILE DATA
// ===============================
function renderProfile(userProfile) {
  const {
    name,
    email,
    phone,
    role,
    memberSince,
    tasksCompleted,
    totalTasks,
    hoursLogged,
    recentActivity
  } = userProfile;

  const percent =
    totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

  // 🔹 Top Navbar
  setText("navUserName", name);
  setText("avatarInitials", getInitials(name));

  // 🔹 Profile Card
  setText("profileName", name);
  setText("profileRole", role);
  setText("profileEmail", email);
  setText("profilePhone", phone || "Not provided");
  setText("profileSince", memberSince);
  setText("profileAvatar", getInitials(name));

  // 🔹 Progress Bar
  const progressBar = document.getElementById("workProgressBar");
  animateProgressBar(progressBar, percent);

  setText("progressBadge", `${percent}% Complete`);
  setText("tasksCompletedText", `${tasksCompleted} tasks`);
  setText("tasksTotalText", totalTasks);
  setText("hoursLoggedText", hoursLogged);

  // 🔹 Recent Activity
  renderActivity(recentActivity);
}

// ===============================
// RECENT ACTIVITY LIST
// ===============================
function renderActivity(activity) {
  const activityList = document.getElementById("activityList");
  activityList.innerHTML = "";

  if (!activity || activity.length === 0) {
    activityList.innerHTML = `<li class="text-muted">No recent activity</li>`;
    return;
  }

  activity.forEach(item => {
    const li = document.createElement("li");
    li.className = "activity-item d-flex justify-content-between";

    li.innerHTML = `
      <div class="activity-label">
        <i class="fa-solid fa-check-circle me-2 text-success"></i>
        ${item.label}
      </div>
      <div class="activity-meta text-end">
        <div>${item.time}</div>
        <small class="text-muted">${item.meta}</small>
      </div>
    `;

    activityList.appendChild(li);
  });
}

// ===============================
// HELPERS
// ===============================
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function animateProgressBar(element, targetPercent) {
  if (!element) return;

  let current = 0;
  element.style.width = "0%";

  const step = () => {
    if (current >= targetPercent) {
      element.style.width = `${targetPercent}%`;
      element.setAttribute("aria-valuenow", targetPercent);
      return;
    }
    current += 1;
    element.style.width = `${current}%`;
    element.setAttribute("aria-valuenow", current);
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

// ===============================
// LOAD PROFILE ON PAGE LOAD
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});
