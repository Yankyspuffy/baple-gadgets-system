const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:password-HZHFu7R%26s%24Q%3FN9E@db.fefoaetnlolkenpcrozw.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  const sql = `
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      due_date DATE,
      status VARCHAR(50) DEFAULT 'pending',
      priority VARCHAR(50) DEFAULT 'medium',
      reminder_email TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await client.query(sql);
  console.log('Table created!');
  
  await client.query("NOTIFY pgrst, 'reload schema'");
  console.log('Schema cache reloaded!');

  await client.end();
}

run().catch(console.error);
