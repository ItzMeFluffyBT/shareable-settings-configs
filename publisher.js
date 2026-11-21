// Some hosts cannot reach Steam from their Worker. Fill missing public metadata
// from the browser, in batches keyed by the account linked to each listing.
const publisherApi = "https://api.deadlock-api.com/v1/players/";
const publisherCache = new Map();
const tiers = ["","Initiate","Seeker","Acolyte","Sentinel","Mystic","Ritualist","Emissary","Oracle","Phantom","Ascendant","Eternus"];
const divisions = ["","I","II","III","IV","V","VI"];

export function statlockerUrl(accountId) {
    return Number.isInteger(accountId) && accountId > 0 && accountId <= 4294967295
        ? "https://statlocker.gg/profile/" + accountId : null;
}

async function publicFields(kind, ids) {
    const fields = new Map(), missing = [], now = Date.now();
    for (const id of ids) {
        const cached = publisherCache.get(kind + id);
        if (cached && cached.until > now) fields.set(id, cached.value);
        else missing.push(id);
    }
    if (!missing.length) return fields;
    try {
        const response = await fetch(publisherApi + kind + "?account_ids=" + missing.join(","), {
            mode:"cors", credentials:"omit", referrerPolicy:"no-referrer", signal:AbortSignal.timeout(4000)
        });
        if (!response.ok) return fields;
        const rows = await response.json();
        if (!Array.isArray(rows)) return fields;
        for (const row of rows) {
            if (!missing.includes(row?.account_id)) continue;
            if (kind === "rank") {
                const {rank:tier, subrank, badge} = row;
                if (Number.isInteger(tier) && tiers[tier] && Number.isInteger(subrank) && divisions[subrank] && badge === tier * 10 + subrank) {
                    fields.set(row.account_id, {name:tiers[tier], tier, subrank, badge, source:"latest-ranked-match",
                        iconUrl:"/art/ranks/" + tier + "-" + subrank + ".webp"});
                }
            } else {
                const avatar = /^https:\/\/avatars(?:\.(?:fastly|akamai|cloudflare))?\.steamstatic\.com\/([a-f0-9]{40})(?:_medium|_full)?\.jpg$/i.exec(row.avatarmedium || row.avatarfull || row.avatar || "");
                if (avatar) fields.set(row.account_id, "https://avatars.steamstatic.com/" + avatar[1].toLowerCase() + "_medium.jpg");
            }
        }
        for (const id of missing) {
            if (publisherCache.size >= 512) publisherCache.delete(publisherCache.keys().next().value);
            publisherCache.set(kind + id, {value:fields.get(id), until:now + (fields.has(id) ? 3600000 : 60000)});
        }
    } catch { /* A private or temporarily unavailable profile still has a usable preset. */ }
    return fields;
}

export async function enrichPublishers(items) {
    const ids = rows => [...new Set(rows.map(p => p.profileAccountId).filter(statlockerUrl))];
    const [avatars, ranks] = await Promise.all([
        publicFields("steam", ids(items.filter(p => !p.avatarUrl))),
        publicFields("rank", ids(items.filter(p => !p.rank)))
    ]);
    for (const p of items) {
        p.avatarUrl ||= avatars.get(p.profileAccountId) || null;
        p.rank ||= ranks.get(p.profileAccountId) || null;
        if (p.rank) p.rankLabel ||= p.rank.name + " " + divisions[p.rank.subrank];
    }
    return items;
}
