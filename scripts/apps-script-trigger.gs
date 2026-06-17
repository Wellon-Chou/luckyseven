/**
 * Google Apps Script — Sheet-triggered GitHub Pages rebuild.
 *
 * Paste this into the Google Sheet's Apps Script editor
 * (Extensions ▸ Apps Script). When the sheet is edited it fires a GitHub
 * `repository_dispatch` (event_type: "sheet-updated"), which runs the
 * "Deploy to GitHub Pages" workflow: that workflow re-fetches the sheet into
 * src/data/sheet.json, rebuilds, and redeploys. Live in ~1–2 min.
 *
 * SETUP (do once):
 *   1. Project Settings ▸ Script properties ▸ add property:
 *        Name:  GITHUB_TOKEN
 *        Value: a GitHub Personal Access Token (see token notes at bottom)
 *   2. In the editor, select the `setup` function and click Run once.
 *      Approve the permissions prompt. This installs the on-edit trigger.
 *   That's it — editing the sheet now triggers a rebuild.
 */

// ===== CONFIG =====
const GITHUB_OWNER = 'ruoyango';
const GITHUB_REPO = 'life-chart-report';
const EVENT_TYPE = 'sheet-updated';
// Coalesce a burst of edits into one build: wait this long after the LAST edit.
const DEBOUNCE_SECONDS = 60;

/**
 * Installable on-edit trigger entry point. (Named onSheetEdit, NOT onEdit, so it
 * runs as an *installable* trigger — simple `onEdit` triggers are not allowed to
 * call UrlFetchApp.)
 */
function onSheetEdit(e) {
  scheduleDispatch_();
}

/**
 * Debounce: (re)schedule a single one-off trigger DEBOUNCE_SECONDS from now.
 * Each new edit cancels the pending one and reschedules, so rapid edits collapse
 * into a single build instead of one build per keystroke.
 */
function scheduleDispatch_() {
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'dispatchBuild') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dispatchBuild')
    .timeBased()
    .after(DEBOUNCE_SECONDS * 1000)
    .create();
}

/** Fires the GitHub repository_dispatch that kicks off the Pages build. */
function dispatchBuild() {
  // Remove the one-off trigger that invoked us (keeps the trigger list clean).
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'dispatchBuild') ScriptApp.deleteTrigger(t);
  });

  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('Missing GITHUB_TOKEN script property.');

  const url =
    'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/dispatches';
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    payload: JSON.stringify({ event_type: EVENT_TYPE }),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  // Success is 204 No Content. Anything else is an error worth surfacing.
  if (code !== 204) {
    throw new Error('GitHub dispatch failed: ' + code + ' ' + res.getContentText());
  }
}

/** Run ONCE manually to install the installable on-edit trigger. */
function setup() {
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'onSheetEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onSheetEdit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
}

/* ───────────────────────────────────────────────────────────────────────────
 * GitHub token notes
 *
 * The repository_dispatch endpoint needs WRITE access to the repo. Use a
 * fine-grained Personal Access Token (github.com ▸ Settings ▸ Developer
 * settings ▸ Personal access tokens ▸ Fine-grained tokens):
 *   - Resource owner: ruoyango
 *   - Repository access: Only select repositories ▸ life-chart-report
 *   - Permissions ▸ Repository permissions ▸ Contents: Read and write
 *       (this is what authorizes POST .../dispatches)
 *   - Set an expiry; you'll need to refresh the Script property when it lapses.
 * Store ONLY in the Script property GITHUB_TOKEN — never paste it into the
 * code body, and never commit it to the repo.
 * ─────────────────────────────────────────────────────────────────────────── */
