// In future, replace this with real user data from backend.
const defaultUserName = "User";

function getInitials(name) {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function showMessage(element, text, isError = false) {
    element.textContent = text;
    element.style.color = isError ? "#fca5a5" : "#bbf7d0";
    setTimeout(() => {
        element.textContent = "";
    }, 2500);
}

document.addEventListener("DOMContentLoaded", () => {
    // Top navbar – can later be set from backend
    const navUserNameEl = document.getElementById("navUserName");
    const avatarInitialsEl = document.getElementById("avatarInitials");

    navUserNameEl.textContent = defaultUserName;
    avatarInitialsEl.textContent = getInitials(defaultUserName);

    // Forms
    const accountForm = document.getElementById("accountForm");
    const accountSaveMsg = document.getElementById("accountSaveMsg");

    const passwordForm = document.getElementById("passwordForm");
    const passwordSaveMsg = document.getElementById("passwordSaveMsg");

    const preferencesForm = document.getElementById("preferencesForm");
    const preferencesSaveMsg = document.getElementById("preferencesSaveMsg");

    const securityMsg = document.getElementById("securityMsg");

    // Account form submit (frontend only)
    accountForm.addEventListener("submit", (e) => {
        e.preventDefault();
        // TODO: send data to backend
        showMessage(accountSaveMsg, "Account settings saved (frontend only).");
    });

    // Password form submit (simple check)
    passwordForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newPass = document.getElementById("newPassword").value;
        const confirmPass = document.getElementById("confirmPassword").value;

        if (newPass !== confirmPass) {
            showMessage(passwordSaveMsg, "New passwords do not match.", true);
            return;
        }

        if (newPass && newPass.length < 8) {
            showMessage(
                passwordSaveMsg,
                "Password must be at least 8 characters.",
                true
            );
            return;
        }

        // TODO: send to backend
        showMessage(passwordSaveMsg, "Password updated (frontend only).");
    });

    // Preferences form submit
    preferencesForm.addEventListener("submit", (e) => {
        e.preventDefault();
        // TODO: send data to backend
        showMessage(preferencesSaveMsg, "Preferences saved (frontend only).");
    });

    // Accent color preview
    const accentDots = document.querySelectorAll(".accent-dot");
    accentDots.forEach((dot) => {
        dot.addEventListener("click", () => {
            accentDots.forEach((d) => d.classList.remove("active"));
            dot.classList.add("active");
            const accent = dot.dataset.accent;
            document.documentElement.setAttribute("data-accent", accent);
        });
    });

    // Security buttons
    const logoutAllBtn = document.getElementById("logoutAllBtn");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    logoutAllBtn.addEventListener("click", () => {
        // TODO: backend for logout
        showMessage(securityMsg, "Logout from all devices requested.");
    });

    deleteAccountBtn.addEventListener("click", () => {
        // Just a warning in frontend. Real delete must be done with backend + confirm.
        showMessage(
            securityMsg,
            "Account deletion is disabled in demo. Connect backend to enable.",
            true
        );
    });
});
