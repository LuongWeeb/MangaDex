const fs = require('fs');
const path = require('path');

describe('SPA page markup', () => {
  test('keeps management pages as sibling sections, not hidden nested content', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
    const pageIds = ['libraryPageView', 'profilePageView', 'uploaderPageView', 'adminPageView'];

    pageIds.slice(0, -1).forEach((pageId, index) => {
      const nextPageId = pageIds[index + 1];
      const section = html.slice(html.indexOf(`id="${pageId}"`), html.indexOf(`id="${nextPageId}"`));
      expect(section).toContain('</section>');
    });

    const adminSection = html.slice(html.indexOf('id="adminPageView"'), html.indexOf('id="toastContainer"'));
    expect(adminSection).toContain('</section>');
  });
});
