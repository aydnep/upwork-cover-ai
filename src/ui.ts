import type { JwtPayload } from "./types.js";

export function renderPage(user: JwtPayload | null, isScraperAvailable: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Upwork Cover Letter AI</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; color: #0f172a; line-height: 1.6; -webkit-font-smoothing: antialiased; }
  .container { max-width: 720px; margin: 0 auto; padding: 32px 20px; }
  h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
  .header-left h1 { margin-bottom: 0; }
  .user-info { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; color: #64748b; }
  .user-info img { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #e2e8f0; }
  .section { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); transition: box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
  .section:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04); }
  .section h2 { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px; color: #64748b; }
  label { display: block; font-size: 13px; font-weight: 500; color: #475569; margin-bottom: 5px; }
  input, textarea, select { width: 100%; padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-family: inherit; background: #fff; color: #1e293b; transition: border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
  input::placeholder, textarea::placeholder { color: #94a3b8; }
  input:focus, textarea:focus, select:focus { outline: none; border-color: #14a800; box-shadow: 0 0 0 3px rgba(20,168,0,0.18); }
  textarea { resize: vertical; min-height: 100px; }
  select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 12 12'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m3 4.5 3 3 3-3'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
  .field { margin-bottom: 14px; }
  .field:last-child { margin-bottom: 0; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .row > .field { margin-bottom: 0; }
  .row-end { align-items: end; }
  .btn { display: inline-flex; align-items: center; justify-content: center; padding: 9px 20px; border: 1px solid transparent; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
  .btn:active { transform: scale(0.97); }
  .btn-primary { background: #14a800; color: #fff; box-shadow: 0 1px 3px rgba(20,168,0,0.3); }
  .btn-primary:hover { background: #118a00; box-shadow: 0 2px 6px rgba(20,168,0,0.35); }
  .btn-primary:disabled { background: #cbd5e1; color: #64748b; cursor: not-allowed; box-shadow: none; }
  .btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
  .btn-secondary:hover { background: #e2e8f0; border-color: #cbd5e1; }
  .btn-sm { padding: 9px 14px; font-size: 14px; }
  .btn-google { background: #fff; color: #334155; border: 1px solid #e2e8f0; padding: 12px 28px; font-size: 15px; gap: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  .btn-google:hover { background: #f8fafc; box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04); }
  .btn-row { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
  .output-area { white-space: pre-wrap; font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.75; min-height: 120px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
  .output-area:empty::before { content: "Your cover letter will appear here..."; color: #94a3b8; font-style: italic; }
  .status { font-size: 13px; font-weight: 500; color: #64748b; }
  .status.error { color: #ef4444; }
  .status.success { color: #14a800; }
  .login-page { text-align: center; padding-top: 100px; }
  .login-page h1 { font-size: 32px; margin-bottom: 10px; letter-spacing: -0.03em; }
  .login-page p { color: #64748b; font-size: 15px; line-height: 1.7; margin-bottom: 36px; max-width: 440px; margin-left: auto; margin-right: auto; }
  .hidden { display: none; }
  .logout-btn { font-size: 13px; color: #94a3b8; background: none; border: none; cursor: pointer; font-family: inherit; font-weight: 500; transition: color 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
  .logout-btn:hover { color: #334155; }
  .import-row { display: flex; gap: 8px; align-items: flex-end; margin-bottom: 6px; }
  .import-row > div { flex: 1; }
  .fetch-row { display: flex; gap: 8px; align-items: flex-end; }
  .fetch-row > div { flex: 1; }
</style>
</head>
<body>
<div class="container">
${user ? renderApp(user, isScraperAvailable) : renderLogin()}
</div>
${user ? renderScript(isScraperAvailable) : ""}
</body>
</html>`;
}

function renderLogin(): string {
  return `<div class="login-page">
  <h1>Upwork Cover Letter AI</h1>
  <p>Generate personalized, compelling cover letters for Upwork jobs in seconds. Sign in to save your profile and start generating.</p>
  <a href="/auth/google" class="btn btn-google">
    <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/></svg>
    Sign in with Google
  </a>
</div>`;
}

function renderApp(user: JwtPayload, isScraperAvailable: boolean): string {
  return `<div class="header">
  <div class="header-left"><h1>Upwork Cover Letter AI</h1></div>
  <div class="user-info">
    ${user.picture ? `<img src="${escapeHtml(user.picture)}" alt="">` : ""}
    <span>${escapeHtml(user.name)}</span>
    <form method="POST" action="/auth/logout" style="display:inline"><button type="submit" class="logout-btn">Logout</button></form>
  </div>
</div>

<div class="section">
  <h2>Your Profile</h2>
  ${isScraperAvailable ? `<div class="import-row">
    <div><label for="import-url">Import from Upwork Profile URL</label><input id="import-url" placeholder="https://www.upwork.com/freelancers/~01..."></div>
    <button class="btn btn-secondary btn-sm" onclick="importProfile()" id="import-btn">Import</button>
  </div>
  <span id="import-status" class="status" style="display:block;margin-bottom:14px"></span>` : ""}
  <div class="field"><label for="p-name">Full Name</label><input id="p-name" placeholder="John Doe"></div>
  <div class="field"><label for="p-title">Professional Title</label><input id="p-title" placeholder="Senior Full-Stack Developer"></div>
  <div class="field"><label for="p-skills">Key Skills</label><input id="p-skills" placeholder="React, Node.js, TypeScript, PostgreSQL"></div>
  <div class="field"><label for="p-experience">Experience Summary</label><textarea id="p-experience" rows="3" placeholder="8+ years building web applications..."></textarea></div>
  <div class="field"><label for="p-portfolio">Portfolio Links</label><input id="p-portfolio" placeholder="https://github.com/you, https://yoursite.com"></div>
  <div class="row">
    <div class="field"><label for="p-rate">Hourly Rate (optional)</label><input id="p-rate" placeholder="$50/hr"></div>
    <div class="field"><label for="p-location">Location (optional)</label><input id="p-location" placeholder="San Francisco, CA"></div>
  </div>
  <div class="field"><label for="p-bio">Bio (optional)</label><textarea id="p-bio" rows="2" placeholder="Short personal bio..."></textarea></div>
  <div class="btn-row">
    <button id="save-profile-btn" class="btn btn-primary btn-sm" onclick="saveProfile()">Save Profile</button>
    <span id="profile-status" class="status"></span>
  </div>
</div>

<div class="section">
  <h2>Job Description</h2>
  ${isScraperAvailable ? `<div class="fetch-row field">
    <div><label for="job-url">Upwork Job URL</label><input id="job-url" placeholder="https://www.upwork.com/jobs/~01..."></div>
    <button class="btn btn-secondary btn-sm" onclick="fetchJob()" id="fetch-btn">Fetch</button>
  </div>` : ""}
  <div class="field"><label for="job-desc">Paste or enter job description</label><textarea id="job-desc" rows="6" placeholder="Paste the full job description here..."></textarea></div>
  <div class="row row-end">
    <div class="field">
      <label for="tone-select">Tone</label>
      <select id="tone-select">
        <option value="professional">Professional</option>
        <option value="friendly">Friendly</option>
        <option value="confident">Confident</option>
        <option value="enthusiastic">Enthusiastic</option>
      </select>
    </div>
    <div class="field">
      <button id="generate-btn" class="btn btn-primary" onclick="generate()" style="width:100%">Generate Cover Letter</button>
    </div>
  </div>
</div>

<div class="section" id="output-section">
  <h2>Cover Letter</h2>
  <div class="output-area" id="output"></div>
  <div class="btn-row">
    <button class="btn btn-secondary btn-sm" onclick="copyOutput()" id="copy-btn">Copy to Clipboard</button>
    <span id="copy-status" class="status"></span>
  </div>
</div>`;
}

function renderScript(isScraperAvailable: boolean): string {
  return `<script>
const $ = (id) => document.getElementById(id);

async function loadProfile() {
  try {
    const res = await fetch("/api/profile");
    const data = await res.json();
    if (data.profile) {
      $("p-name").value = data.profile.name || "";
      $("p-title").value = data.profile.title || "";
      $("p-skills").value = data.profile.skills || "";
      $("p-experience").value = data.profile.experienceSummary || "";
      $("p-portfolio").value = data.profile.portfolioLinks || "";
      $("p-rate").value = data.profile.hourlyRate || "";
      $("p-location").value = data.profile.location || "";
      $("p-bio").value = data.profile.bio || "";
    }
  } catch (e) {
    console.error("Failed to load profile", e);
  }
}

async function saveProfile() {
  const btn = $("save-profile-btn");
  const status = $("profile-status");
  btn.disabled = true;
  status.textContent = "Saving...";
  status.className = "status";
  try {
    const body = {
      name: $("p-name").value,
      title: $("p-title").value,
      skills: $("p-skills").value,
      experienceSummary: $("p-experience").value,
      portfolioLinks: $("p-portfolio").value,
      hourlyRate: $("p-rate").value || undefined,
      location: $("p-location").value || undefined,
      bio: $("p-bio").value || undefined,
    };
    const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      status.textContent = "Saved!";
      status.className = "status success";
    } else {
      status.textContent = data.error || "Failed to save";
      status.className = "status error";
    }
  } catch (e) {
    status.textContent = "Network error";
    status.className = "status error";
  } finally {
    btn.disabled = false;
  }
}
${isScraperAvailable ? `
async function importProfile() {
  const btn = $("import-btn");
  const status = $("import-status");
  const url = $("import-url").value.trim();
  if (!url) return;
  btn.disabled = true;
  btn.textContent = "Importing...";
  status.textContent = "";
  status.className = "status";
  try {
    const res = await fetch("/api/import-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    const data = await res.json();
    if (res.ok && data.profile) {
      $("p-name").value = data.profile.name || "";
      $("p-title").value = data.profile.title || "";
      $("p-skills").value = data.profile.skills || "";
      $("p-experience").value = data.profile.experienceSummary || "";
      $("p-portfolio").value = data.profile.portfolioLinks || "";
      $("p-rate").value = data.profile.hourlyRate || "";
      $("p-location").value = data.profile.location || "";
      $("p-bio").value = data.profile.bio || "";
      status.textContent = "Profile imported! Review and save.";
      status.className = "status success";
    } else {
      status.textContent = data.error || "Failed to import profile";
      status.className = "status error";
    }
  } catch (e) {
    status.textContent = "Network error";
    status.className = "status error";
  } finally {
    btn.disabled = false;
    btn.textContent = "Import";
  }
}

async function fetchJob() {
  const btn = $("fetch-btn");
  const url = $("job-url").value.trim();
  if (!url) return;
  btn.disabled = true;
  btn.textContent = "Fetching...";
  try {
    const res = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    const data = await res.json();
    if (res.ok && data.markdown) {
      $("job-desc").value = data.markdown;
    } else {
      alert(data.error || "Failed to fetch job");
    }
  } catch (e) {
    alert("Network error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Fetch";
  }
}` : ""}

async function generate() {
  const btn = $("generate-btn");
  const output = $("output");
  const jobDesc = $("job-desc").value.trim();
  if (!jobDesc) { alert("Please enter a job description"); return; }
  btn.disabled = true;
  btn.textContent = "Generating...";
  output.textContent = "";
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription: jobDesc, tone: $("tone-select").value }),
    });
    if (!res.ok) {
      const data = await res.json();
      output.textContent = data.error || "Generation failed";
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") break;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.content) output.textContent += parsed.content;
          if (parsed.error) output.textContent += "\\nError: " + parsed.error;
        } catch {}
      }
    }
  } catch (e) {
    output.textContent = "Network error: " + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate Cover Letter";
  }
}

function copyOutput() {
  const text = $("output").textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const s = $("copy-status");
    s.textContent = "Copied!";
    s.className = "status success";
    setTimeout(() => { s.textContent = ""; }, 2000);
  });
}

loadProfile();
</script>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
