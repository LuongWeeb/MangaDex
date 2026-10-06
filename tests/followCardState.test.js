const fs = require('fs');
const path = require('path');

describe('Followed story-card state', () => {
  test('uses one persistent followed class and a white selected background', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'javascripts', 'main.js'), 'utf8');
    const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'stylesheets', 'style.css'), 'utf8');

    expect(js).toContain("isFollowed ? 'followed' : ''");
    expect(js).toContain("btn.classList.add('followed')");
    expect(css).toMatch(/\.card-bookmark-btn\.followed\s*\{[\s\S]*background:\s*#ffffff/);
  });
});
