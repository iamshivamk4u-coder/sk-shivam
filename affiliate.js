const link = document.querySelector('#affiliate-link');
const copyButton = document.querySelector('.copy-link');
const shareButton = document.querySelector('.plain-share');
const toast = document.querySelector('.toast');
const menuButton = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.side-nav');

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => { toast.hidden = true; }, 2500);
}

async function copyReferralLink() {
  try {
    await navigator.clipboard.writeText(link.textContent.trim());
    copyButton.textContent = 'Copied!';
    showToast('Referral link copied.');
    window.setTimeout(() => { copyButton.textContent = 'Copy link'; }, 1800);
  } catch {
    showToast('Copy the referral link shown above.');
  }
}

copyButton?.addEventListener('click', copyReferralLink);
shareButton?.addEventListener('click', async () => {
  const referralLink = link.textContent.trim();
  if (navigator.share) {
    await navigator.share({ title: 'Learn with SkillLance', text: 'Explore SkillLance courses with my referral link.', url: referralLink });
  } else {
    await copyReferralLink();
  }
});
menuButton?.addEventListener('click', () => sidebar.classList.toggle('open'));
sidebar?.querySelectorAll('nav a').forEach((item) => item.addEventListener('click', () => sidebar.classList.remove('open')));
