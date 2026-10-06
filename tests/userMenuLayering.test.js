const fs = require('fs');
const path = require('path');

const stylesheet = fs.readFileSync(path.join(__dirname, '..', 'public', 'stylesheets', 'style.css'), 'utf8');

describe('user menu layering', () => {
  test('places the header stacking context above the main navigation', () => {
    const headerRule = stylesheet.match(/\.site-header\s*\{[^}]*\}/)?.[0] || '';
    const mainNavRules = [...stylesheet.matchAll(/\.main-nav-bar\s*\{[^}]*\}/g)].map((match) => match[0]);
    const headerLayer = Number(headerRule.match(/^\s*z-index:\s*(\d+)/m)?.[1]);
    const navLayers = mainNavRules.map((rule) => Number(rule.match(/^\s*z-index:\s*(\d+)/m)?.[1])).filter(Number.isFinite);

    expect(headerLayer).toBeGreaterThan(Math.max(...navLayers));
  });
});
