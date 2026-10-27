import { supabase, siteUrl } from "./supabase-client.js";

const link = document.querySelector("#affiliate-link");
const copyButton = document.querySelector(".copy-link");
const shareButton = document.querySelector(".plain-share");
const toast = document.querySelector(".toast");
const menuButton = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".side-nav");
const profileButton = document.querySelector(".profile");
const profileDialog = document.querySelector("#profile-dialog");
const profileClose = document.querySelector(".profile-close");
const profileEditButton = document.querySelector(".profile-edit");
const profileEditForm = document.querySelector("#profile-edit-form");
const profileDetails = document.querySelector(".profile-details");
const profileEditActions = document.querySelector(".profile-dialog-actions");
const money = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => { toast.hidden = true; }, 2500);
}

function setAll(selector, value) {
  document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
}

function writeNumber(selector, value) {
  document.querySelectorAll(selector).forEach((element) => { element.textContent = money.format(value || 0); });
}

function addSaleRows(sales) {
  const table = document.querySelector("#sales-table");
  if (!sales.length) return;
  table.innerHTML = sales.slice(0, 8).map((sale) => `<tr><td>${sale.course_code}</td><td>${sale.customer_id === window.currentUserId ? "Your purchase" : "Referral purchase"}</td><td>${new Date(sale.paid_at || sale.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td><td>₹${money.format(sale.amount)}</td><td>₹${money.format(sale.commission_amount || 0)}</td><td><span class="link-status">● ${sale.payment_status}</span></td></tr>`).join("");
}

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.replace("login.html");
  throw new Error("Sign-in is required to view the affiliate dashboard.");
}

const user = session.user;
window.currentUserId = user.id;
const [{ data: profile }, { data: affiliate }] = await Promise.all([
  supabase.from("profiles").select("full_name, email, mobile, state, account_status, avatar_url, package_name").eq("user_id", user.id).single(),
  supabase.from("affiliates").select("id, referral_code, status").eq("user_id", user.id).single(),
]);
const { data: enrollments = [] } = await supabase.from("enrollments").select("course_code").eq("customer_id", user.id).eq("access_status", "granted");
const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "SkillLancer";
const courseNames = { ELITE: "Elite Package", MARKETING: "Marketing Mastery", SOFT: "Soft Skill Mastery", PRO: "Pro Package", PRIME: "Prime Package", FINANCE: "Finance Package" };
const enrolledPackages = enrollments.map((enrollment) => courseNames[enrollment.course_code] || enrollment.course_code);
setAll(".affiliate-name", displayName);
let currentAvatarUrl = profile?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?backgroundType=solid&backgroundColor=ffcf52&seed=${encodeURIComponent(displayName)}`;
document.querySelectorAll(".profile-avatar, .profile-picture, .profile-hero-picture").forEach((image) => { image.src = currentAvatarUrl; });
setAll("[data-profile-email]", profile?.email || user.email || "—");
document.querySelector("[data-profile-mobile]").textContent = profile?.mobile || "Not added";
document.querySelector("[data-profile-state]").textContent = profile?.state || "Not added";
document.querySelector("[data-profile-code]").textContent = affiliate?.referral_code || "Preparing";
document.querySelector("[data-profile-status]").textContent = profile?.account_status || "Active";
const packageName = profile?.package_name || (enrolledPackages.length ? enrolledPackages.join(", ") : "No active package");
document.querySelector("[data-package-name]").textContent = packageName;
document.querySelector("[data-profile-package]").textContent = packageName;
document.querySelector("#edit-mobile").value = profile?.mobile || "";
document.querySelector("#edit-package-name").value = profile?.package_name || enrolledPackages.join(", ");

if (affiliate?.referral_code) link.textContent = `${siteUrl}/?ref=${affiliate.referral_code}`;
else {
  link.textContent = "Your affiliate link is being prepared.";
  copyButton.disabled = true;
}

const [{ data: commissions = [] }, { data: payouts = [] }, { data: sales = [] }] = affiliate?.id
  ? await Promise.all([
      supabase.from("commissions").select("amount, status").eq("affiliate_id", affiliate.id),
      supabase.from("payouts").select("amount, status").eq("affiliate_id", affiliate.id),
      supabase.from("sales").select("customer_id, course_code, amount, paid_at, created_at, payment_status").or(`customer_id.eq.${user.id},affiliate_id.eq.${affiliate.id}`),
    ])
  : [{ data: [] }, { data: [] }, { data: [] }];
const totalCommission = commissions.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.amount, 0);
const paidOut = payouts.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);
const affiliateSales = sales.filter((sale) => sale.customer_id !== user.id);
const paidAffiliateSales = affiliateSales.filter((sale) => sale.payment_status === "paid");
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);
const sevenDaysStart = new Date(todayStart);
sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);
const revenueSince = (startDate) => paidAffiliateSales
  .filter((sale) => new Date(sale.paid_at || sale.created_at) >= startDate)
  .reduce((sum, sale) => sum + sale.amount, 0);
writeNumber("[data-earnings]", totalCommission);
writeNumber("[data-payout]", Math.max(totalCommission - paidOut, 0));
writeNumber("[data-referrals]", affiliateSales.length);
writeNumber("[data-sales]", affiliateSales.length);
writeNumber("[data-today-revenue]", revenueSince(todayStart));
writeNumber("[data-week-revenue]", revenueSince(sevenDaysStart));
document.querySelector("[data-last-refresh]").textContent = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
addSaleRows(affiliateSales.map((sale) => ({ ...sale, commission_amount: Math.round(sale.amount * 0.7) })));

async function copyReferralLink() {
  try {
    await navigator.clipboard.writeText(link.textContent.trim());
    copyButton.textContent = "Copied!";
    showToast("Referral link copied.");
    window.setTimeout(() => { copyButton.textContent = "Copy link"; }, 1800);
  } catch { showToast("Copy the referral link shown above."); }
}

copyButton?.addEventListener("click", copyReferralLink);
shareButton?.addEventListener("click", async () => {
  const referralLink = link.textContent.trim();
  if (navigator.share) await navigator.share({ title: "Learn with SkillLance", text: "Explore SkillLance courses with my referral link.", url: referralLink });
  else await copyReferralLink();
});
menuButton?.addEventListener("click", () => sidebar.classList.toggle("open"));
sidebar?.querySelectorAll("nav a").forEach((item) => item.addEventListener("click", () => sidebar.classList.remove("open")));
document.querySelectorAll(".refresh-income").forEach((button) => button.addEventListener("click", (event) => {
  event.preventDefault();
  window.location.reload();
}));
profileButton?.addEventListener("click", () => profileDialog.showModal());
document.querySelector(".profile-card-button")?.addEventListener("click", () => profileDialog.showModal());
profileClose?.addEventListener("click", () => profileDialog.close());
profileEditButton?.addEventListener("click", () => {
  profileDetails.hidden = true;
  profileEditActions.hidden = true;
  profileEditForm.hidden = false;
  profileEditForm.style.display = "grid";
});
document.querySelector(".cancel-profile-edit")?.addEventListener("click", () => {
  profileEditForm.hidden = true;
  profileEditForm.style.display = "";
  profileDetails.hidden = false;
  profileEditActions.hidden = false;
});
profileEditForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = profileEditForm.querySelector("button[type=submit]");
  const message = profileEditForm.querySelector(".profile-edit-message");
  const form = new FormData(profileEditForm);
  submit.disabled = true;
  message.hidden = true;
  try {
    const photo = form.get("avatar_file");
    if (photo?.size) {
      if (photo.size > 2 * 1024 * 1024) throw new Error("Please choose a photo smaller than 2 MB.");
      const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/profile.${extension}`;
      const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, photo, { upsert: true, contentType: photo.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      currentAvatarUrl = `${data.publicUrl}?updated=${Date.now()}`;
    }
    const { data: updatedProfile, error } = await supabase.rpc("update_my_profile", {
      p_full_name: displayName,
      p_mobile: form.get("mobile") || "",
      p_state: profile?.state || "",
      p_avatar_url: currentAvatarUrl,
      p_package_name: form.get("package_name") || "",
    });
    if (error) throw error;
    const savedPackage = updatedProfile?.package_name || form.get("package_name") || "No active package";
    document.querySelectorAll(".profile-avatar, .profile-picture, .profile-hero-picture").forEach((image) => { image.src = currentAvatarUrl; });
    document.querySelector("[data-profile-mobile]").textContent = updatedProfile?.mobile || "Not added";
    document.querySelector("[data-package-name]").textContent = savedPackage;
    document.querySelector("[data-profile-package]").textContent = savedPackage;
    message.textContent = "Profile updated successfully.";
    message.className = "profile-edit-message success";
    message.hidden = false;
    window.setTimeout(() => {
      profileEditForm.hidden = true;
      profileEditForm.style.display = "";
      profileDetails.hidden = false;
      profileEditActions.hidden = false;
    }, 700);
  } catch (error) {
    message.textContent = error.message || "Could not update your profile.";
    message.className = "profile-edit-message";
    message.hidden = false;
  } finally {
    submit.disabled = false;
  }
});
document.querySelector(".sign-out")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.assign("index.html");
});
