import {enrichPublishers} from "./publisher.js";
import {backend,onPages} from "./hosting.js";

export const validId = id => typeof id === "string" && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id);
const legacyKey = "deadlock-configs.favorites.v1";
const viewerKey = "deadlock-configs.favorite-viewer.v1";
let migration;

export function viewerHeaders(create = false) {
    let key = localStorage.getItem(viewerKey);
    if (!key && create) {
        key = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2,"0")).join("");
        localStorage.setItem(viewerKey, key);
    }
    if (!key) return {};
    if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("The saved favorites key could not be read.");
    return {"X-Config-Favorites":key};
}
export function legacyFavorites() {
    const list = JSON.parse(localStorage.getItem(legacyKey) || "[]");
    if (!Array.isArray(list) || !list.every(validId)) throw new Error("The saved favorites list could not be read.");
    return [...new Set(list)];
}
function writeFavorites(ids, enabled) {
    return api("/api/presets/favorites?" + new URLSearchParams({ids:ids.join(",")}), {
        method:enabled ? "PUT" : "DELETE", headers:viewerHeaders(true)
    });
}
async function migrateFavorites() {
    // A browser from an older release can have more than one page of saved stars.
    // Acknowledge each batch before clearing it. Retried batches count once.
    let remaining = legacyFavorites();
    while (remaining.length) {
        const batch = remaining.slice(0,50);
        await writeFavorites(batch,true);
        remaining = legacyFavorites().filter(id => !batch.includes(id));
        localStorage.setItem(legacyKey, JSON.stringify(remaining));
    }
}
function readyFavorites() {
    if (!migration) migration = migrateFavorites().finally(() => { migration = null; });
    return migration;
}
export async function favorite(id, enabled) {
    if (!validId(id)) throw new Error("Invalid config ID.");
    await readyFavorites();
    await writeFavorites([id], enabled);
    return enabled;
}
export async function api(path, options) {
    if (!path.startsWith("/api/")) throw new Error("Invalid directory request.");
    const response = await fetch(onPages ? backend + path : path, {cache: "no-store", ...options});
    if (response.status === 204) return null;
    const json = await response.json();
    if (!response.ok) throw new Error(typeof json.error === "string" ? json.error : json.error?.message || "The directory could not complete this request.");
    return json;
}
export async function detail(id) {
    if (!validId(id)) throw new Error("Invalid config ID.");
    const preset = (await api("/api/presets/" + id)).preset;
    const item = {...preset, rankLabel: rankLabel(preset.rank)};
    await enrichPublishers([item]);
    return item;
}
// Valve subdivisions are displayed as Roman numerals in the game.
function rankLabel(rank) {
    const subdivisions = ["", "I", "II", "III", "IV", "V", "VI"];
    if (!rank || typeof rank.name !== "string" || !Number.isInteger(rank.subrank) ||
        rank.subrank < 1 || rank.subrank > 6) return "";
    return rank.name + " " + subdivisions[rank.subrank];
}
export async function search(q = "", favoritesOnly = false, cursor = null, mine = false, headers, personalized = true) {
    if (personalized) await readyFavorites();
    const params = new URLSearchParams({q, order:"popular"});
    if (mine) params.set("mine", "1");
    if (favoritesOnly) params.set("favorites", "1");
    if (cursor) params.set("cursor", cursor);
    const data = await api("/api/presets?" + params, {headers:{...headers,...(personalized ? viewerHeaders() : {})}});
    const items = data.presets.map(p => ({
        id: p.id, name: p.name, steamId: p.steamId, steamName: p.displayName,
        profileAccountId: p.profileAccountId ?? null, linkedSteamId: p.linkedSteamId ?? null,
        avatarUrl: p.avatarUrl ?? null, rank: p.rank ?? null,
        rankLabel: rankLabel(p.rank), rankLinked: p.rankLinked === true, steamVerified: p.steamVerified === true,
        heroSpecific: p.heroSpecific, updatedAt: p.updatedAt, needsRecapture:p.needsRecapture,
        favorite: p.favorite === true, favoriteCount: p.favoriteCount ?? 0
    }));
    await enrichPublishers(items);
    return {items, nextCursor:data.nextCursor};
}
