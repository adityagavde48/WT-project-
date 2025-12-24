// ----- VIEW SWITCHING -----
const loginView = document.getElementById("loginView");
const signupView = document.getElementById("signupView");
const goToSignup = document.getElementById("goToSignup");
const goToLogin = document.getElementById("goToLogin");

function showLogin() {
  signupView.classList.add("d-none");
  signupView.classList.remove("active-view");

  loginView.classList.remove("d-none");
  // force reflow to restart animation
  void loginView.offsetWidth;
  loginView.classList.add("active-view");
}


function showSignup() {
  loginView.classList.add("d-none");
  loginView.classList.remove("active-view");

  signupView.classList.remove("d-none");
  void signupView.offsetWidth;
  signupView.classList.add("active-view");
}

if (goToSignup) goToSignup.addEventListener("click", showSignup);
if (goToLogin) goToLogin.addEventListener("click", showLogin);

// ----- LOGIN FORM -----
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      // TODO: change this URL to your backend login route
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        loginMessage.textContent = "Invalid email or password.";
        loginMessage.classList.add("text-danger");
        loginForm.classList.remove("shake");
        void loginForm.offsetWidth;
        loginForm.classList.add("shake");
        return;
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);

      loginMessage.textContent = "Login successful! Redirecting...";
      loginMessage.classList.remove("text-danger");
      loginMessage.classList.add("text-success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    } catch (err) {
      console.error(err);
      loginMessage.textContent = "Server error. Please try again.";
      loginMessage.classList.add("text-danger");
    }
  });
}

// ----- SIGNUP FORM -----
const signupForm = document.getElementById("signupForm");
const passwordError = document.getElementById("passwordError");
const signupMessage = document.getElementById("signupMessage");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(signupForm);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      passwordError.classList.remove("d-none");
      return;
    }
    passwordError.classList.add("d-none");

    const payload = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      password,
      // role will be set later in dashboard
    };

    try {
      // TODO: change this URL to your backend signup route
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        signupMessage.textContent = errorText || "Sign up failed.";
        signupMessage.classList.add("text-danger");
        return;
      }

      signupMessage.textContent = "Account created! Redirecting to login...";
      signupMessage.classList.remove("text-danger");
      signupMessage.classList.add("text-success");

      setTimeout(() => {
        showLogin();
      }, 900);
    } catch (err) {
      console.error(err);
      signupMessage.textContent = "Server error. Please try again.";
      signupMessage.classList.add("text-danger");
    }
  });
}

