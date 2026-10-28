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

    const newFullName = form.get("full_name") || displayName;

    const { data: updatedProfile, error } = await supabase.rpc("update_my_profile", {
      p_full_name: newFullName, // Updated full name value
      p_mobile: form.get("mobile") || "",
      p_state: profile?.state || "",
      p_avatar_url: currentAvatarUrl,
      p_package_name: form.get("package_name") || "",
    });
    if (error) throw error;

    const savedPackage = updatedProfile?.package_name || form.get("package_name") || "No active package";
    
    // Update all elements showing the user's name instantly
    setAll(".affiliate-name", newFullName);

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