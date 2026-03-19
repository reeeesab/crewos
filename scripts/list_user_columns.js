const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='User' ORDER BY ordinal_position;");
  console.log('columns:', res.rows);
  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
