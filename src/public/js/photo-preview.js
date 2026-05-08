(function () {
  const fileInputs = document.querySelectorAll("input[data-photo-input]");

  function clearPreview(img) {
    img.src = "";
    img.hidden = true;
  }

  for (const input of fileInputs) {
    const key = input.getAttribute("data-photo-input");
    const preview = document.querySelector(`img[data-photo-preview="${key}"]`);
    if (!preview) continue;

    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) {
        clearPreview(preview);
        return;
      }

      if (!file.type.startsWith("image/")) {
        clearPreview(preview);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = String(event.target?.result || "");
        preview.hidden = false;
      };
      reader.readAsDataURL(file);
    });
  }
})();
