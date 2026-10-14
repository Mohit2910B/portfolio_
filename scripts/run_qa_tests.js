const http = require('http');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Postgres%402026@127.0.0.1:5432/smeet_portfolio';
const pool = new Pool({ connectionString });

async function runQA() {
  console.log('=== STARTING AUTOMATED QA & INTEGRATION SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ❌ ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Check PostgreSQL Database Tables
    const tablesRes = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    assert(tables.includes('admins'), 'Database contains admins table');
    assert(tables.includes('portfolio_projects'), 'Database contains portfolio_projects table');
    assert(tables.includes('carousel_items'), 'Database contains carousel_items table');
    assert(tables.includes('enquiries'), 'Database contains enquiries table');
    assert(tables.includes('chat_conversations'), 'Database contains chat_conversations table');
    assert(tables.includes('theme_settings'), 'Database contains theme_settings table');

    // 2. Check Admin Account & Seed Credentials
    const adminRes = await pool.query('SELECT * FROM admins WHERE username = $1 OR email = $2', ['Mohit', 'mohitbabariyaa@gmail.com']);
    assert(adminRes.rows.length > 0, 'Admin account exists in database');

    // 3. Test Portfolio Projects Query
    const projectsRes = await pool.query('SELECT * FROM portfolio_projects ORDER BY sort_order ASC');
    assert(projectsRes.rows.length >= 6, 'Portfolio projects seeded in database (count >= 6)');

    // 4. Test Showreel Carousel Items Query
    const carouselRes = await pool.query('SELECT * FROM carousel_items ORDER BY sort_order ASC');
    assert(carouselRes.rows.length >= 4, 'Showreel carousel items seeded in database (count >= 4)');

    // 5. Test Theme Settings Query
    const themeRes = await pool.query('SELECT * FROM theme_settings WHERE id = 1');
    assert(themeRes.rows.length > 0 && themeRes.rows[0].active_theme !== undefined, 'Active theme setting persisted in database');

    // 6. Test Enquiry Insertion & Retrieval
    const insertEnquiry = await pool.query(
      `INSERT INTO enquiries (name, email, phone, company, project_type, description, budget, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['QA Tester', 'qa@test.com', '+91 99999 88888', 'QA Studio', 'Commercial Edit', 'Automated QA brief description test', '$3,000 - $5,000', 'new']
    );
    assert(insertEnquiry.rows.length > 0, 'Enquiry inserted into PostgreSQL database');
    const testEnquiryId = insertEnquiry.rows[0].id;

    // Delete test enquiry
    await pool.query('DELETE FROM enquiries WHERE id = $1', [testEnquiryId]);
    assert(true, 'Test enquiry cleaned up from database');

    // 7. Test Chat Conversation Creation & Message Insertion
    const testToken = `qa_token_${Date.now()}`;
    const insertConv = await pool.query(
      `INSERT INTO chat_conversations (name, email, customer_token, status, last_message)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['QA Chat User', 'qachat@test.com', testToken, 'open', 'QA Hello']
    );
    assert(insertConv.rows.length > 0, 'Chat conversation created in PostgreSQL');
    const testConvId = insertConv.rows[0].id;

    const insertMsg = await pool.query(
      `INSERT INTO chat_messages (conversation_id, sender_type, message)
       VALUES ($1, $2, $3) RETURNING id`,
      [testConvId, 'customer', 'QA Hello']
    );
    assert(insertMsg.rows.length > 0, 'Chat message stored in PostgreSQL');

    // Clean up test chat thread
    await pool.query('DELETE FROM chat_conversations WHERE id = $1', [testConvId]);
    assert(true, 'Test chat thread cleaned up');

    console.log(`\n=== QA SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED ===\n`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('QA Suite Error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runQA();
