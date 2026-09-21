// Builds the public dataset from the live benchmark cohort, reproducing src/scoring/cohort.ts
// (one latest score per public domain at the current methodology version, completed scans only,
// visibilitymesh.com / lunafashionhouse.com / *.myshopify.com excluded).
//   node build_dataset.mjs [--write]      keys: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in answerops-engine/.env
// Ownership rule (privacy): a domain is PUBLISHED only when every scan that produced its counted score was
// seeded by the operator (email in SEED_EMAILS, source web, no shopify_customer_id, no agency_id).
// Domains scanned by strangers (free scan), by app merchants, by paying customers or by agencies are EXCLUDED
// and only counted, never named.
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('C:/Dev/answerops-dev/answerops-engine/.env', 'utf8').split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
const URL_ = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const VERSION = 'aivs-1.0-aeo20260620-full-evid20260621';
const H = { apikey: KEY, authorization: 'Bearer ' + KEY };
const WRITE = process.argv.includes('--write');

async function all(path) {
  const out = [];
  for (let off = 0; ; off += 1000) {
    const r = await fetch(`${URL_}/rest/v1/${path}${path.includes('?') ? '&' : '?'}limit=1000&offset=${off}`, { headers: H });
    if (!r.ok) throw new Error(path + ' ' + r.status + ' ' + (await r.text()).slice(0, 200));
    const j = await r.json(); out.push(...j); if (j.length < 1000) break;
  }
  return out;
}
const norm = (u) => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch { return u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]; } };
const excluded = (d) => d === 'visibilitymesh.com' || d === 'lunafashionhouse.com' || d.endsWith('.myshopify.com');

const totals = await all(`scan_totals?select=scan_id,total_score,max_score,maturity_band,config_version&config_version=eq.${encodeURIComponent(VERSION)}`);
const scans = await all(`scans?select=id,target_url,created_at,status,source,email,shopify_customer_id,agency_id,customer_id,tier&status=eq.done`);
const facts = await all(`scan_facts?select=scan_id,platform,is_ecommerce`);
console.log(`scan_totals@version ${totals.length}, done scans ${scans.length}, scan_facts ${facts.length}, pulled ${new Date().toISOString()}`);

const emailCount = {};
for (const s of scans) { const e = (s.email || '').toLowerCase(); emailCount[e] = (emailCount[e] || 0) + 1; }
console.log('top emails:', Object.entries(emailCount).sort((a, b) => b[1] - a[1]).slice(0, 8));

const byScan = new Map(scans.map(s => [s.id, s]));
const factBy = new Map(); for (const f of facts) if (f.platform || f.is_ecommerce !== null) factBy.set(f.scan_id, f);
const latest = new Map();
for (const t of totals) {
  const s = byScan.get(t.scan_id); if (!s) continue;
  const d = norm(s.target_url); if (excluded(d)) continue;
  const max = t.max_score > 0 ? t.max_score : 100;
  const score = Math.round((t.total_score / max) * 1000) / 10;
  if (!(score >= 0 && score <= 100)) continue;
  const at = s.created_at ? Date.parse(s.created_at) : 0;
  const prev = latest.get(d);
  if (!prev || at > prev.at) latest.set(d, { domain: d, score, band: t.maturity_band, at, scan: s, fact: factBy.get(t.scan_id) });
}
const members = [...latest.values()];
const scores = members.map(m => m.score).sort((a, b) => a - b);
const med = scores.length % 2 ? scores[(scores.length - 1) / 2] : (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2;
console.log(`cohort all: n=${members.length} median=${med} below50=${(100 * scores.filter(s => s < 50).length / scores.length).toFixed(1)}% leading=${members.filter(m => m.band === 'Leading').length}`);

const SEED_EMAILS = (process.env.SEED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const isSeeded = (s) => s.source === 'web' && !s.shopify_customer_id && !s.agency_id && !s.customer_id && SEED_EMAILS.includes((s.email || '').toLowerCase());
const pub = members.filter(m => isSeeded(m.scan));
const wh = members.filter(m => !isSeeded(m.scan)); const ws = wh.map(m => m.score).sort((a, b) => a - b);
console.log("withheld: n", wh.length, "median", ws.length ? ws[Math.floor(ws.length / 2)] : null, "ecommerce", wh.filter(m => m.fact && m.fact.is_ecommerce === true).length, "shopify", wh.filter(m => m.fact && m.fact.platform === "shopify").length, "by source", JSON.stringify(wh.reduce((a, m) => (a[m.scan.source + (m.scan.shopify_customer_id ? "+shop" : "")] = (a[m.scan.source + (m.scan.shopify_customer_id ? "+shop" : "")] || 0) + 1, a), {})));
const priv = members.length - pub.length;
console.log(`publishable (operator seeded): ${pub.length}; withheld (customer, app, agency or stranger scans): ${priv}`);
if (!SEED_EMAILS.length) { console.log('SEED_EMAILS not set: nothing written. Set SEED_EMAILS=a@b,c@d and rerun.'); process.exit(0); }

const platform = (f) => !f ? 'unknown' : (f.platform ? f.platform : (f.is_ecommerce === false ? 'not_ecommerce' : 'unknown'));
const rows = pub.sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain)).map((m, i) => ({
  rank: i + 1, domain: m.domain, ai_legibility_score: m.score.toFixed(1), band: m.band,
  platform: platform(m.fact), is_ecommerce: m.fact && m.fact.is_ecommerce !== null ? String(m.fact.is_ecommerce) : 'unknown',
  scanned_on: new Date(m.at).toISOString().slice(0, 10), methodology_version: VERSION,
}));
const csv = ['rank,domain,ai_legibility_score,band,platform,is_ecommerce,scanned_on,methodology_version', ...rows.map(r => Object.values(r).join(','))].join('\n') + '\n';
const pubScores = rows.map(r => +r.ai_legibility_score).sort((a, b) => a - b);
const pmed = pubScores.length % 2 ? pubScores[(pubScores.length - 1) / 2] : (pubScores[pubScores.length / 2 - 1] + pubScores[pubScores.length / 2]) / 2;
const bands = {}; for (const r of rows) bands[r.band] = (bands[r.band] || 0) + 1;
const stats = { generated_at: new Date().toISOString(), methodology_version: VERSION, cohort_all_n: members.length, cohort_all_median: med, published_n: rows.length, published_median: pmed, published_below_50_pct: +(100 * pubScores.filter(s => s < 50).length / pubScores.length).toFixed(1), withheld_n: priv, bands, platforms: rows.reduce((a, r) => (a[r.platform] = (a[r.platform] || 0) + 1, a), {}) };
console.log(JSON.stringify(stats, null, 1));
if (WRITE) {
  fs.writeFileSync(new URL('./ai_legibility_scores.csv', import.meta.url), csv);
  fs.writeFileSync(new URL('./stats.json', import.meta.url), JSON.stringify(stats, null, 2));
  console.log('written ai_legibility_scores.csv and stats.json');
}
