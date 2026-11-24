import {detail, search} from "./catalog.js";
import {statlockerUrl} from "./publisher.js";
const el = id => document.getElementById(id);
const keyEye = document.querySelector(".key-eye");
let blinkTimeout = null, blinkAnimation = null;
function setKeyBlinkActive(active) {
    if (!active) {
        clearTimeout(blinkTimeout);
        blinkTimeout = null;
        if (blinkAnimation) blinkAnimation.cancel();
        blinkAnimation = null;
        return;
    }
    if (!keyEye?.animate || blinkTimeout !== null) return;
    // Leave long, irregular intervals between blinks while the cover is in view.
    blinkTimeout = setTimeout(() => {
        blinkTimeout = null;
        blinkAnimation = keyEye.animate([
            {transform: "scaleY(1)"},
            {transform: "scaleY(.045)", offset: .4},
            {transform: "scaleY(.045)", offset: .48},
            {transform: "scaleY(1)"}
        ], {duration: 210, easing: "ease-in-out"});
        blinkAnimation.onfinish = () => { blinkAnimation = null; };
        setKeyBlinkActive(true);
    }, 35000 + Math.random() * 50000);
}
let view = "", generation = 0, nextCursor = null, searchText = "";
function status(message = "", error = false) {
    el("status").textContent = message;
    el("status").classList.toggle("error", error);
}
function node(tag, text, cls) {
    const element = document.createElement(tag);
    if (text != null) element.textContent = text;
    if (cls) element.className = cls;
    return element;
}
function button(text, run, cls = "button") {
    const control = node("button", text, cls);
    control.type = "button";
    control.onclick = async () => {
        control.disabled = true;
        try { await run(control); } catch (e) { status(e.message, true); }
        finally { control.disabled = false; }
    };
    return control;
}
function empty(title, link, label) {
    const box = node("div", null, "empty");
    box.append(node("h2", title));
    if (link) {
        const a = node("a", label, "button"); a.href = link; box.append(a);
    }
    el("result-list").replaceChildren(box);
}
function image(url, cls) {
    const img = node("img", null, cls);
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => img.remove();
    img.src = url;
    return img;
}
function publisher(preset) {
    const identity = node("span", null, "publisher-id");
    const name = preset.steamName || preset.displayName || "Unknown player";
    const portrait = node("span", Array.from(name.trim())[0]?.toUpperCase() || "?", "publisher-portrait");
    portrait.setAttribute("aria-hidden", "true");
    if (preset.avatarUrl) portrait.append(image(preset.avatarUrl, "publisher-avatar"));
    identity.append(portrait, node("span", name, "publisher-name"));
    if (preset.rankLabel) {
        const badge = node("span", null, "publisher-rank");
        badge.title = preset.rankLabel;
        if (preset.rank?.iconUrl) badge.append(image("./art/ranks/" + preset.rank.tier + "-" + preset.rank.subrank + ".webp", "rank-medal"));
        badge.append(node("span", preset.rankLabel));
        identity.append(badge);
    }
    if (Number.isInteger(preset.downloadCount)) {
        const count=node("span",preset.downloadCount+(preset.downloadCount===1 ? " download" : " downloads"),"download-count");
        count.title="Steam accounts that applied this config";
        identity.append(count);
    }
    return identity;
}
let fullPresetText = "", nativeCodeText = "", detailRequest = 0;
async function showDetail(id) {
    const seq = generation, request = ++detailRequest;
    const [p, inspector] = await Promise.all([detail(id), import("./inspector.js")]);
    if (seq !== generation || request !== detailRequest) return;
    el("detail-name").replaceChildren(publisher(p));
    el("detail-by").textContent = p.name;
    const values = p.extraSettings?.values;
    nativeCodeText = p.code;
    fullPresetText = values ? JSON.stringify({format:"deadlock-settings-preset", version:1, name:p.name,
        code:p.code, heroSpecific:p.heroSpecific, extraSettings:p.extraSettings}) : "";
    el("detail-code").value = fullPresetText || nativeCodeText;
    el("code-label").textContent = values ? "Enhanced Settings preset" : "Deadlock settings code";
    el("copy-code").textContent = values ? "Copy preset" : "Copy code";
    el("copy-native").hidden = !values;
    el("export-code").open = false;
    inspector.inspectPreset(p);
    const stats = statlockerUrl(p.profileAccountId);
    const link = el("statlocker-profile");
    link.hidden = !stats;
    if (stats) link.href = stats;
    else link.removeAttribute("href");
    const profile = p.linkedSteamId || p.steamId;
    const hasProfile = /^76561\d{12}$/.test(profile || "");
    el("steam-profile").hidden = !hasProfile;
    if (hasProfile) el("steam-profile").href = "https://steamcommunity.com/profiles/" + profile;
    else el("steam-profile").removeAttribute("href");
    el("copy-status").textContent = "";
    if (!el("details").open) el("details").showModal();
    el("details").scrollTop = 0;
}
function entry(item) {
    const row = node("article", null, "entry"), desc = node("div");
    const open = button(null, () => showDetail(item.id), "entry-open");
    const name = node("span", item.name, "entry-config-name");
    if (item.needsRecapture) {
        const warning = node("span", "⚠︎", "capture-triangle");
        warning.title = "Older or incomplete capture";
        warning.setAttribute("aria-label", warning.title);
        name.prepend(warning);
    }
    open.append(publisher(item), name);
    desc.append(open); row.append(desc);
    return row;
}
async function loadList(append = false) {
    const seq = ++generation;
    status();
    el("more").hidden = true;
    if (!append) { el("result-list").replaceChildren(); nextCursor = null; }
    status("Loading configs…");
    try {
        const result = await search(searchText, false, append ? nextCursor : null, false, undefined, false);
        if (seq !== generation) return;
        for (const item of result.items) el("result-list").append(entry(item));
        nextCursor = result.nextCursor;
        el("more").hidden = !nextCursor;
        if (!el("result-list").children.length) {
            if (searchText) empty("No matching configs");
            else empty("No public configs yet");
        }
        status();
    } catch (e) { if (seq === generation) {status(e.message, true); el("more").hidden = !append;} }
}
async function route(navigated = false) {
    ++generation;
    const [page, hashQuery] = location.hash.slice(1).split("?");
    const params = new URLSearchParams(hashQuery ?? (page ? "" : location.search));
    const guide = page === "publish" || page === "mine" || page.startsWith("edit/");
    const was = view;
    if (guide) view = "publish";
    else if (page === "favorites") view = "browse";
    else if (page === "browse" || (!page && params.has("q"))) view = "browse";
    else view = "home";
    status();
    const listing = view === "browse";
    el("landing").hidden = view !== "home";
    updateCoverMotion();
    el("directory").hidden = !listing;
    el("publisher").hidden = view !== "publish";
    for (const a of document.querySelectorAll("nav a, .brand")) {
        if (a.hash === "#" + view) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
    }
    if (el("details").open) el("details").close();
    if (listing) el("page-title").textContent = "Community configs";
    const heading = el(listing ? "page-title" : guide ? "publish-title" : page === "install" ? "install-title" : "landing-title");
    document.title = view === "home" ? "Enhanced Settings" : heading.textContent + " | Enhanced Settings";
    if (page === "install") {
        heading.focus({preventScroll: true});
        el("install").scrollIntoView();
    } else if (navigated && (was !== view || page === "home")) {
        heading.focus({preventScroll: true});
        window.scrollTo(0, 0);
    }
    if (!listing) return;
    el("query").value = searchText = (params.get("q") || "").trim().slice(0, 100);
    await loadList();
}
el("search-form").onsubmit = e => {
    e.preventDefault();
    const query = el("query").value.trim();
    if (query === searchText) { loadList(); return; }
    const params = new URLSearchParams({q: query});
    location.hash = query ? view + "?" + params.toString() : view;
};
el("more").onclick = () => loadList(true);
el("close-detail").onclick = () => el("details").close();
async function copyDownload(text, kind) {
    el("detail-code").value = text;
    el("code-label").textContent = kind === "Preset" ? "Enhanced Settings preset" : "Deadlock settings code";
    try { await navigator.clipboard.writeText(text); el("copy-status").textContent = kind + " copied."; }
    catch { el("export-code").open = true; el("detail-code").select(); el("copy-status").textContent = kind + " selected. Use your browser’s Copy command."; }
}
el("copy-code").onclick = () => copyDownload(fullPresetText || nativeCodeText, fullPresetText ? "Preset" : "Code");
el("copy-native").onclick = () => copyDownload(nativeCodeText, "Code");
const cover = document.querySelector(".landing-hero");
const keyModel = cover.querySelector(".key-model");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const hoverPointer = matchMedia("(any-hover: hover) and (any-pointer: fine)");
let coverInView = !("IntersectionObserver" in window);
let pointerEvents = null, pointerFrame = null, cursorX = 0, cursorY = 0;

function resetKeyPerspective() {
    if (pointerFrame !== null) cancelAnimationFrame(pointerFrame);
    pointerFrame = null;
    keyModel.style.removeProperty("transform");
}
function tiltKey(event) {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
        resetKeyPerspective();
        return;
    }
    cursorX = event.clientX;
    cursorY = event.clientY;
    if (pointerFrame !== null) return;
    pointerFrame = requestAnimationFrame(() => {
        pointerFrame = null;
        const bounds = cover.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const horizontal = Math.max(-1, Math.min(1, (cursorX - bounds.left) * 2 / bounds.width - 1));
        const vertical = Math.max(-1, Math.min(1, (cursorY - bounds.top) * 2 / bounds.height - 1));
        keyModel.style.transform = `rotateX(${(-16 * vertical).toFixed(2)}deg) rotateY(${(24 * horizontal).toFixed(2)}deg)`;
    });
}
function updateCoverMotion() {
    const active = !motionPreference.matches && !document.hidden && !el("landing").hidden && coverInView;
    cover.classList.toggle("motion-active", active);
    setKeyBlinkActive(active);
    const canTilt = active && hoverPointer.matches;
    if (canTilt && !pointerEvents) {
        pointerEvents = new AbortController();
        const options = {passive: true, signal: pointerEvents.signal};
        cover.addEventListener("pointermove", tiltKey, options);
        cover.addEventListener("pointerleave", resetKeyPerspective, options);
        cover.addEventListener("pointercancel", resetKeyPerspective, options);
        window.addEventListener("blur", resetKeyPerspective, options);
    } else if (!canTilt && pointerEvents) {
        pointerEvents.abort();
        pointerEvents = null;
        resetKeyPerspective();
    }
}
document.addEventListener("visibilitychange", updateCoverMotion);
motionPreference.addEventListener("change", updateCoverMotion);
hoverPointer.addEventListener("change", updateCoverMotion);
if ("IntersectionObserver" in window) {
    const motion = new IntersectionObserver(entries => {
        for (const entry of entries) {
            entry.target.classList.toggle("in-view", entry.isIntersecting);
            if (entry.target === cover) { coverInView = entry.isIntersecting; updateCoverMotion(); }
        }
    });
    document.querySelectorAll(".watch-motion").forEach(section => motion.observe(section));
}
window.addEventListener("hashchange", () => route(true).catch(e => status(e.message, true)));
route().catch(e => status(e.message, true));
