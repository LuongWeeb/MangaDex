const db = require('../common/db');

async function migrate() {
  const query = (sql) => new Promise((resolve) => {
    db.query(sql, (err, res) => {
      if (err) resolve({ error: err.message });
      else resolve(res);
    });
  });

  async function addColumnIfMissing(table, column, definition) {
    const existing = await query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
    if (existing.error) return console.log(`${table}.${column}:`, existing.error);
    if (existing.length) return console.log(`${table}.${column}: already exists`);
    const result = await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`${table}.${column}:`, result.error || 'added');
  }

  console.log('1. Checking required V3 columns...');
  await addColumnIfMissing('stories', 'approval_status', "ENUM('Chờ duyệt', 'Đã duyệt', 'Từ chối') DEFAULT 'Chờ duyệt'");
  await addColumnIfMissing('stories', 'origin_country', "ENUM('china', 'japan', 'korea', 'vietnam') DEFAULT NULL");
  await addColumnIfMissing('users', 'full_name', 'VARCHAR(100) DEFAULT NULL');
  await addColumnIfMissing('users', 'gender', "ENUM('male', 'female', 'other') DEFAULT NULL");

  console.log('2. Setting all existing stories to Đã duyệt...');
  await query(`UPDATE stories SET approval_status = 'Đã duyệt' WHERE approval_status IS NULL OR approval_status = 'Chờ duyệt'`);
  console.log('2.1 Backfilling story origins from Manga/Manhua/Manhwa categories...');
  await query(`
    UPDATE stories s
    SET origin_country = CASE
      WHEN EXISTS (SELECT 1 FROM story_categories sc JOIN categories c ON c.id = sc.category_id WHERE sc.story_id = s.id AND c.slug = 'manhua') THEN 'china'
      WHEN EXISTS (SELECT 1 FROM story_categories sc JOIN categories c ON c.id = sc.category_id WHERE sc.story_id = s.id AND c.slug = 'manhwa') THEN 'korea'
      WHEN EXISTS (SELECT 1 FROM story_categories sc JOIN categories c ON c.id = sc.category_id WHERE sc.story_id = s.id AND c.slug = 'manga') THEN 'japan'
      ELSE origin_country
    END
    WHERE origin_country IS NULL
  `);

  console.log('3. Checking is_banned...');
  await addColumnIfMissing('users', 'is_banned', 'TINYINT(1) DEFAULT 0');

  console.log('✅ Migration completed!');
  process.exit(0);
}

migrate();
