import {compare, describe, drawCrosshair, importable, requiresHeroSettings} from "./settings-reader.js";

const el = id => document.getElementById(id);
const baselineKey = "deadlock-configs.comparison.v1";
let target, baseline, storageNote = "";
let changes = [], unpairedCrosshairs = [], page = 0;
const pageSize = 20;

function validateBaseline(p) {
    if (typeof p?.code !== "string") throw new Error("Paste a DL. code or a preset copied from the mod.");
    describe(p.code, true, p.extraSettings);
    return {code:p.code, extraSettings:p.extraSettings,
        heroSpecific:typeof p.heroSpecific === "boolean" ? p.heroSpecific : undefined};
}

try {
    const saved = localStorage.getItem(baselineKey);
    if (saved) {
        try { baseline = validateBaseline(JSON.parse(saved)); }
        catch { storageNote = "Your saved comparison could not be read. Paste a fresh export."; }
    }
} catch { /* This browser can still compare a baseline in memory. */ }

function readBaseline(raw) {
    const text = raw.trim();
    let p;
    if (text.startsWith("DL.")) p = {code:text};
    else {
        try { p = JSON.parse(text); } catch { /* checked below */ }
        if (p?.format !== "deadlock-settings-preset" || p.version !== 1)
            throw new Error("Paste a DL. code or a preset copied from the mod.");
    }
    return validateBaseline(p);
}

function element(tag, text) {
    const n = document.createElement(tag);
    n.textContent = text;
    return n;
}

function renderChangeTable() {
    const container = el("settings-rows");
    container.replaceChildren();
    const filter = el("changes-hero"), selected = filter.value || "";
    const counts = new Map();
    for (const change of changes) {
        const hero = change.hero || "Base settings";
        counts.set(hero,(counts.get(hero) || 0) + 1);
    }
    filter.replaceChildren();
    for (const hero of ["", ...Array.from(counts.keys()).sort()]) {
        const opt = element("option",(hero || "All heroes") + " (" + (hero ? counts.get(hero) : changes.length) + ")");
        opt.value = hero; filter.append(opt);
    }
    filter.value = counts.has(selected) ? selected : "";
    filter.hidden = !changes.length;
    const rows = filter.value ? changes.filter(row => (row.hero || "Base settings") === filter.value) : changes;
    filter.onchange = () => { page=0; renderChangeTable(); };
    el("settings-pages").hidden = rows.length <= pageSize;
    if (!changes.length) {
        previewSavedCrosshairs(unpairedCrosshairs);
        return;
    }
    const table = document.createElement("table");
    table.className = "changes-table";
    table.setAttribute("aria-label", "Changed settings");
    const head = document.createElement("thead"), headings = document.createElement("tr");
    for (const label of ["Setting", "Before", "After"]) {
        const th = element("th", label);
        th.scope = "col";
        headings.append(th);
    }
    head.append(headings);
    const body = document.createElement("tbody");
    const start = page * pageSize;
    for (const change of rows.slice(start, start + pageSize)) {
        const tr = document.createElement("tr"), label = element("th", change.setting);
        label.scope = "row";
        const context = element("span", [change.hero, change.category].filter(Boolean).join(" · "));
        context.className = "setting-context";
        label.append(context);
        const before = document.createElement("td"), after = document.createElement("td");
        if (change.afterPreview) {
            drawCrosshair(before, change.beforePreview);
            drawCrosshair(after, change.afterPreview);
        } else {
            before.textContent = change.before;
            after.textContent = change.after;
        }
        tr.append(label, before, after);
        body.append(tr);
    }
    table.append(head, body); container.append(table);
    previewSavedCrosshairs(unpairedCrosshairs);
    const pages = Math.ceil(rows.length / pageSize);
    el("previous-changes").hidden = page === 0;
    el("next-changes").hidden = page + 1 >= pages;
    el("changes-page").textContent = (page + 1) + " / " + pages;
}

function previewSavedCrosshairs(rows) {
    const sights = rows.filter(row => row.afterPreview);
    if (!sights.length) return;
    const figure = document.createElement("figure"), preview = document.createElement("div");
    figure.append(element("figcaption", "Preset crosshair"));
    if (sights.length > 1) {
        const select = document.createElement("select");
        select.setAttribute("aria-label", "Crosshair scope");
        for (const [index, row] of sights.entries()) {
            const option = element("option", row.hero || "Base settings");
            option.value = String(index); select.append(option);
        }
        select.onchange = () => { preview.replaceChildren(); drawCrosshair(preview, sights[select.selectedIndex].afterPreview); };
        figure.append(select);
    }
    figure.append(preview); drawCrosshair(preview, sights[0].afterPreview);
    const group = document.createElement("div"); group.className = "preset-crosshairs";
    group.append(figure); el("settings-rows").append(group);
}

function renderSettings() {
    const comparing = !!baseline;
    changes = []; unpairedCrosshairs = []; page = 0;
    el("settings-heading").textContent = comparing ? "Changes from your settings" : "Preset preview";
    el("baseline-editor").querySelector("summary").textContent = baseline ? "Change comparison settings" : "Compare with my settings";
    el("clear-baseline").hidden = !baseline && !storageNote;
    renderChangeTable();
    try {
        const result = comparing
            ? compare(baseline.code, target.code, target.heroSpecific !== false || baseline.heroSpecific !== false,
                baseline.extraSettings, target.extraSettings, true, true)
            : describe(target.code, true, target.extraSettings);
        if (comparing && baseline.heroSpecific === false && target.heroSpecific === true &&
            requiresHeroSettings(importable(target.code, target.extraSettings), {mouseSensitivity:true})) {
            result.changes.unshift({hero:"Base settings", category:"Advanced", setting:"Hero-specific settings", before:"Off", after:"On"});
            result.total++;
        }
        const summary = [];
        if (comparing) {
            const verified = result.changes.filter(row => row.beforeKnown !== false && (!row.afterPreview || row.beforePreview));
            unpairedCrosshairs = result.changes.filter(row => row.afterPreview && (row.beforeKnown === false || !row.beforePreview));
            changes = verified.filter(row => row.afterPreview).concat(verified.filter(row => !row.afterPreview));
            const missing = result.changes.length - changes.length;
            summary.push(changes.length ? changes.length + (changes.length === 1 ? " change" : " changes") :
                missing || result.unknownCount ? "No confirmed changes" : "Your captured settings match.");
            if (missing) summary.push(missing + (missing === 1 ? " setting missing" : " settings missing") + " from your current export");
            renderChangeTable();
        } else {
            summary.push("Add your current export to see what would change.");
            previewSavedCrosshairs(result.changes);
        }
        if (result.unknownCount) summary.push("Includes unrecognized fields");
        el("settings-summary").textContent = summary.join(" · ");
    } catch (e) {
        el("settings-summary").textContent = e.message || "This export could not be read.";
    }
}

export function inspectPreset(p) {
    target = p;
    el("capture-warning").hidden = p.extraSettings?.values?.citadel_show_active_slot_popup != null;
    el("baseline-editor").open = false;
    el("baseline-code").value = "";
    el("baseline-status").textContent = storageNote;
    renderSettings();
}

el("baseline-form").onsubmit = event => {
    event.preventDefault();
    try {
        const next = readBaseline(el("baseline-code").value);
        storageNote = "";
        try { localStorage.setItem(baselineKey, JSON.stringify(next)); }
        catch { storageNote = "Browser storage is unavailable. This comparison lasts until you leave."; }
        baseline = next;
        el("baseline-code").value = "";
        el("baseline-editor").open = !!storageNote;
        el("baseline-status").textContent = storageNote;
        renderSettings();
    } catch (err) { el("baseline-status").textContent = err.message; }
};
el("clear-baseline").onclick = () => {
    storageNote = "";
    try { localStorage.removeItem(baselineKey); }
    catch { storageNote = "Comparison cleared for this visit. Browser storage is unavailable."; }
    baseline = null;
    inspectPreset(target);
    if (storageNote) el("baseline-editor").open = true;
};
el("previous-changes").onclick = () => { if (page > 0) { page--; renderChangeTable(); } };
el("next-changes").onclick = () => { if ((page + 1) * pageSize < changes.length) { page++; renderChangeTable(); } };
