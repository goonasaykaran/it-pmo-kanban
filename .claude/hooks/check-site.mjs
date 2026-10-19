// Site Guard: a PostToolUse hook that scans index.html after every Claude edit.
// Pass: shows a one-line report card. Fail: exit 2 sends the problems back to
// Claude so it fixes them before moving on.
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import vm from "node:vm";

// Pops a Windows desktop notification in the background so the hook stays fast
function notify(title, text, ok) {
  if (process.platform !== "win32") return;
  const q = s => s.replace(/'/g, "''");
  const ps = [
    "Add-Type -AssemblyName System.Windows.Forms, System.Drawing",
    "$n = New-Object System.Windows.Forms.NotifyIcon",
    `$n.Icon = [System.Drawing.SystemIcons]::${ok ? "Shield" : "Error"}`,
    `$n.BalloonTipTitle = '${q(title)}'`,
    `$n.BalloonTipText = '${q(text)}'`,
    `$n.BalloonTipIcon = '${ok ? "Info" : "Error"}'`,
    "$n.Visible = $true",
    "$n.ShowBalloonTip(6000)",
    "Start-Sleep -Seconds 7",
    "$n.Dispose()"
  ].join("; ");
  spawn("powershell.exe", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", ps],
    { detached: true, stdio: "ignore", windowsHide: true }).unref();
}

const started = performance.now();
const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const file = input.tool_input?.file_path || input.tool_response?.filePath || "";
if (!/(^|[\\/])index\.html$/i.test(file)) process.exit(0);

const html = readFileSync(file, "utf8");
const problems = [];

// 1. Every inline script must parse
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
scripts.forEach((code, i) => {
  try { new vm.Script(code, { filename: `inline-script-${i + 1}.js` }); }
  catch (err) { problems.push(`Inline script ${i + 1} has a syntax error: ${err.message}`); }
});

// 2. Every id the script looks up must exist in the markup
const js = scripts.join("\n");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const wanted = new Set([...js.matchAll(/getElementById\("([^"$`]+)"\)/g)].map(m => m[1]));
const missing = [...wanted].filter(id => !ids.has(id));
if (missing.length) problems.push(`getElementById() targets missing from the markup: ${missing.join(", ")}`);

// 3. Duplicate ids break lookups and labels
const allIds = [...html.matchAll(/\bid="([^"$`]+)"/g)].map(m => m[1]);
const dupes = [...new Set(allIds.filter((id, i) => allIds.indexOf(id) !== i))];
if (dupes.length) problems.push(`Duplicate id attributes: ${dupes.join(", ")}`);

// 4. WhatsApp button must point at a real international number
const wa = js.match(/const WHATSAPP_NUMBER = "([^"]*)"/);
if (!wa) problems.push("WHATSAPP_NUMBER constant is missing, so the WhatsApp button has no number.");
else if (!/^[1-9]\d{7,14}$/.test(wa[1])) problems.push(`WHATSAPP_NUMBER "${wa[1]}" is not digits-only international format (e.g. 6581124980).`);
else if (/^6500000000$/.test(wa[1])) problems.push("WHATSAPP_NUMBER is still the placeholder.");

// 5. External scripts must pin an exact version
const unpinned = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/gi)].map(m => m[1])
  .filter(src => /^https?:/.test(src) && !/\d+\.\d+\.\d+/.test(src));
if (unpinned.length) problems.push(`External scripts without a pinned version: ${unpinned.join(", ")}`);

const ms = Math.round(performance.now() - started);
if (problems.length) {
  notify("🚨 Site Guard blocked an edit", `${problems.length} problem${problems.length === 1 ? "" : "s"} in index.html. Claude is fixing it.\n${problems[0]}`, false);
  process.stderr.write(`🚨 SITE GUARD BLOCKED the edit to index.html (${problems.length} problem${problems.length === 1 ? "" : "s"}):\n- ${problems.join("\n- ")}\nFix these before continuing.\n`);
  process.exit(2);
}

const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
const phone = wa[1].replace(/^(\d{2})(\d{4})(\d{4})$/, "+$1 $2 $3");
notify("🛡️ Site Guard: index.html cleared", `Checked in ${ms}ms. JS parses, ${wanted.size} elements wired, WhatsApp → ${phone}. Safe to ship 🚀`, true);
process.stdout.write(JSON.stringify({
  suppressOutput: true,
  systemMessage: `🛡️ SITE GUARD ✅ index.html cleared in ${ms}ms · JS parses · ${wanted.size} element hooks wired · 0 duplicate ids · WhatsApp → ${phone} · ${kb} KB · safe to ship 🚀`
}));
