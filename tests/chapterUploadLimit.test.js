const fs = require('fs');
const path = require('path');

describe('Chapter image upload limit', () => {
  test('allows up to 200 files in both create and update endpoints', () => {
    const routes = fs.readFileSync(path.join(__dirname, '..', 'routes', 'uploaderRoute.js'), 'utf8');
    const client = fs.readFileSync(path.join(__dirname, '..', 'public', 'javascripts', 'main.js'), 'utf8');

    expect(routes.match(/uploadChapterImages\.array\('chapter_images', 200\)/g)).toHaveLength(2);
    expect(client).toContain('nextFiles.length > 200');
  });
});
