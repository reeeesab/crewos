const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/saasforge'
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;");
  console.log(res.rows.map(r => r.table_name));
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
