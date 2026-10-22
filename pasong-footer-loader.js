// PASONG AUTO FOOTER - Loads one footer for all pages
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Fix body to allow footer to show
  document.documentElement.style.height = "auto";
  document.documentElement.style.overflowY = "auto";
  document.body.style.height = "auto";
  document.body.style.minHeight = "100vh";
  document.body.style.display = "flex";
  document.body.style.flexDirection = "column";

  // 2. Remove all old cut footers
  document.querySelectorAll("footer").forEach(f => f.remove());

  // 3. Load new footer
  try {
    const res = await fetch("pasong-footer.html");
    const html = await res.text();
    document.body.insertAdjacentHTML("beforeend", html);
  } catch (e) {
    // Fallback if fetch fails - inject directly
    const fallback = `<footer style="display:block;width:100%;background:#09080f;padding:32px 20px 120px;margin-top:40px"><div style="text-align:center;color:#5a5a6a;font-size:12px">© 2026 PASONG - Footer loaded</div></footer>`;
    document.body.insertAdjacentHTML("beforeend", fallback);
  }
});
