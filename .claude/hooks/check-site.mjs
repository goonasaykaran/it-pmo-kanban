// Site Guard: a PostToolUse hook that scans index.html after every Claude edit.
// Pass: shows a one-line report card. Fail: exit 2 sends the problems back to
// Claude so it fixes them before moving on.
import { readFileSync, appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";

// Run log so you can confirm the hook fired: %TEMP%\site-guard.log
const LOG = join(tmpdir(), "site-guard.log");
const log = line => { try { appendFileSync(LOG, `${new Date().toISOString()} ${line}\n`); } catch {} };

// Windows toast notification. It is handed to Windows before the hook exits,
// so it stays on screen (and in Notification Centre) after the hook finishes.
function notify(title, text) {
  if (process.platform !== "win32") return;
  const q = s => s.replace(/'/g, "''");
  const ps = [
    "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null",
    "$xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)",
    "$t = $xml.GetElementsByTagName('text')",
    `$t.Item(0).AppendChild($xml.CreateTextNode('${q(title)}')) > $null`,
    `$t.Item(1).AppendChild($xml.CreateTextNode('${q(text)}')) > $null`,
    "[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe').Show([Windows.UI.Notifications.ToastNotification]::new($xml))"
  ].join("; ");
  const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { windowsHide: true, timeout: 4000 });
  log(`toast ${r.status === 0 ? "sent" : "failed: " + String(r.stderr || r.error).trim()}`);
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
  log(`BLOCKED ${problems.length} problem(s): ${problems.join(" | ")}`);
  notify("🚨 Site Guard blocked an edit", `${problems.length} problem${problems.length === 1 ? "" : "s"} in index.html. Claude is fixing it. ${problems[0]}`);
  process.stderr.write(`🚨 SITE GUARD BLOCKED the edit to index.html (${problems.length} problem${problems.length === 1 ? "" : "s"}):\n- ${problems.join("\n- ")}\nFix these before continuing.\n`);
  process.exit(2);
}

const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
const phone = wa[1].replace(/^(\d{2})(\d{4})(\d{4})$/, "+$1 $2 $3");
log(`PASSED in ${ms}ms`);
notify("🛡️ Site Guard: index.html cleared", `Checked in ${ms}ms. JS parses, ${wanted.size} elements wired, WhatsApp → ${phone}. Safe to ship 🚀`);
process.stdout.write(JSON.stringify({
  suppressOutput: true,
  systemMessage: `🛡️ SITE GUARD ✅ index.html cleared in ${ms}ms · JS parses · ${wanted.size} element hooks wired · 0 duplicate ids · WhatsApp → ${phone} · ${kb} KB · safe to ship 🚀`
}));
