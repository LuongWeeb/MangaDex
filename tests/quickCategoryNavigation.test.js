const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const readProjectFile = (...segments) => fs.readFileSync(path.join(projectRoot, ...segments), 'utf8');

describe('quick category navigation', () => {
  test('returns to the home content region before rendering category or ranking results', () => {
    const script = readProjectFile('public', 'javascripts', 'main.js');

    expect(script).toMatch(/function navigateToCategory\([\s\S]*?showAppPage\('homePageView'\)/);
    expect(script).toMatch(/function navigateToRanking\([\s\S]*?showAppPage\('homePageView'\)/);
  });

  test('uses Manga instead of Romance in the quick navigation', () => {
    const markup = readProjectFile('public', 'index.html');

    expect(markup).toContain("navigateToCategoryBySlug('manga', 'Manga')");
    expect(markup).not.toContain("navigateToCategoryBySlug('romance', 'Romance')");
  });
});
