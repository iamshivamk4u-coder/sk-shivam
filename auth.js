import { supabase, siteUrl } from "./supabase-client.js";

const message = document.querySelector(".form-message");
const showMessage = (text, type = "error") => {
  message.textContent = text;
  message.className = `form-message ${type}`;
  message.hidden = false;
};

const loginForm = document.querySelector("#login-form");
loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = loginForm.querySelector("button[type=submit]");
  submit.disabled = true;
  const { error } = await supabase.auth.signInWithPassword({
    email: document.querySelector("#email").value.trim(),
    password: document.querySelector("#password").value,
  });
  submit.disabled = false;
  if (error) return showMessage(error.message);
  window.location.assign("affiliate-dashboard.html");
});

document.querySelector("#forgot-password")?.addEventListener("click", async () => {
  const email = document.querySelector("#email").value.trim();
  if (!email) return showMessage("Enter your e-mail address first, then choose Forgot password.");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/set-password.html` });
  if (error) return showMessage(error.message);
  showMessage("Password reset link sent. Check your e-mail inbox.", "success");
});

const passwordForm = document.querySelector("#set-password-form");
passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = document.querySelector("#new-password").value;
  if (password !== document.querySelector("#confirm-password").value) return showMessage("Passwords do not match.");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return showMessage("This password link is invalid or has expired. Request a new link from the sign-in page.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return showMessage(error.message);
  showMessage("Password saved. Opening your dashboard…", "success");
  window.setTimeout(() => window.location.assign("affiliate-dashboard.html"), 900);
});
