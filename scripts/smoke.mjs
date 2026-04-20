/**
 * Quick API smoke: health, DB health, public events count.
 * Usage: node scripts/smoke.mjs [baseUrl]
 * Default baseUrl: http://127.0.0.1:5000
 */

const base = (process.argv[2] || 'http://127.0.0.1:5000').replace(/\/$/, '');

async function get(path) {
    const url = `${base}${path}`;
    const res = await fetch(url);
    const text = await res.text();
    let body;
    try {
        body = JSON.parse(text);
    } catch {
        body = text;
    }
    return { url, status: res.status, body };
}

async function main() {
    console.log(`Smoke against ${base}\n`);

    const health = await get('/api/health');
    console.log(`GET /api/health          -> ${health.status}`, health.body?.database ? JSON.stringify(health.body.database) : '');

    const db = await get('/api/health/db');
    console.log(`GET /api/health/db       -> ${db.status}`, db.body?.database?.state || '');

    const events = await get('/api/events');
    const n = Array.isArray(events.body) ? events.body.length : '?';
    console.log(`GET /api/events          -> ${events.status} (${n} events)`);

    const ok = health.status === 200 && db.status === 200 && events.status === 200;
    if (!ok) {
        console.error('\nSmoke FAILED');
        process.exit(1);
    }
    console.log('\nSmoke OK');
}

main().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
});
