const db = require('../common/db');

const categories = [
  { name: 'Action', slug: 'action' },
  { name: 'Adventure', slug: 'adventure' },
  { name: 'Anime', slug: 'anime' },
  { name: 'Chuyển Sinh', slug: 'chuyen-sinh' },
  { name: 'Cổ Đại', slug: 'co-dai' },
  { name: 'Comedy', slug: 'comedy' },
  { name: 'Comic', slug: 'comic' },
  { name: 'Demons', slug: 'demons' },
  { name: 'Detective', slug: 'detective' },
  { name: 'Doujinshi', slug: 'doujinshi' },
  { name: 'Drama', slug: 'drama' },
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Gender Bender', slug: 'gender-bender' },
  { name: 'Harem', slug: 'harem' },
  { name: 'Historical', slug: 'historical' },
  { name: 'Horror', slug: 'horror' },
  { name: 'Huyền Huyễn', slug: 'huyen-huyen' },
  { name: 'Isekai', slug: 'isekai' },
  { name: 'Josei', slug: 'josei' },
  { name: 'Mafia', slug: 'mafia' },
  { name: 'Magic', slug: 'magic' },
  { name: 'Manga', slug: 'manga' },
  { name: 'Manhua', slug: 'manhua' },
  { name: 'Manhwa', slug: 'manhwa' },
  { name: 'Martial Arts', slug: 'martial-arts' },
  { name: 'Military', slug: 'military' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Ngôn Tình', slug: 'ngon-tinh' },
  { name: 'One shot', slug: 'one-shot' },
  { name: 'Psychological', slug: 'psychological' },
  { name: 'Romance', slug: 'romance' },
  { name: 'School Life', slug: 'school-life' },
  { name: 'Sci-fi', slug: 'sci-fi' },
  { name: 'Seinen', slug: 'seinen' },
  { name: 'Shoujo', slug: 'shoujo' },
  { name: 'Shoujo Ai', slug: 'shoujo-ai' },
  { name: 'Shounen', slug: 'shounen' },
  { name: 'Shounen Ai', slug: 'shounen-ai' },
  { name: 'Slice of life', slug: 'slice-of-life' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Supernatural', slug: 'supernatural' },
  { name: 'Tiên Hiệp', slug: 'tien-hiep' },
  { name: 'Tragedy', slug: 'tragedy' },
  { name: 'Trọng Sinh', slug: 'trong-sinh' },
  { name: 'Truyện Màu', slug: 'truyen-mau' },
  { name: 'Webtoon', slug: 'webtoon' },
  { name: 'Xuyên Không', slug: 'xuyen-khong' }
];

async function seedCategories() {
  for (const c of categories) {
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO categories (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
        [c.name, c.slug],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }
  console.log('✅ Đã nạp thành công ' + categories.length + ' thể loại!');

  // Gán thêm thể loại cho các bộ truyện mẫu để test lọc
  // 1: Tiên Nghịch -> Tiên Hiệp, Huyền Huyễn, Trọng Sinh, Martial Arts
  // 2: Đấu Phá Thương Khung -> Huyền Huyễn, Action, Fantasy, Chuyển Sinh
  // 3: One Piece -> Action, Adventure, Shounen, Manga, Comedy
  // 4: Vo Luyen Dinh Phong -> Huyền Huyễn, Martial Arts, Manhua, Action
  const storyGenreMapping = [
    { title: 'Tiên Nghịch', genres: ['Tiên Hiệp', 'Huyền Huyễn', 'Trọng Sinh', 'Martial Arts'] },
    { title: 'Đấu Phá Thương Khung', genres: ['Huyền Huyễn', 'Action', 'Fantasy', 'Chuyển Sinh', 'Manhua'] },
    { title: 'One Piece', genres: ['Action', 'Adventure', 'Shounen', 'Manga', 'Comedy'] },
    { title: 'Vo Luyen Dinh Phong', genres: ['Huyền Huyễn', 'Martial Arts', 'Manhua', 'Action', 'Webtoon'] }
  ];

  for (const m of storyGenreMapping) {
    db.query('SELECT id FROM stories WHERE title LIKE ?', [`%${m.title}%`], async (err, stories) => {
      if (err || !stories.length) return;
      const storyId = stories[0].id;
      for (const gName of m.genres) {
        db.query('SELECT id FROM categories WHERE name = ?', [gName], (err2, cats) => {
          if (err2 || !cats.length) return;
          const catId = cats[0].id;
          db.query('INSERT IGNORE INTO story_categories (story_id, category_id) VALUES (?, ?)', [storyId, catId]);
        });
      }
    });
  }

  setTimeout(() => {
    console.log('✅ Gán thể loại cho truyện hoàn tất!');
    process.exit(0);
  }, 1500);
}

seedCategories();
