/** Desktop form factor collection — run after mobile in CI */
module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4174/sunslide/'],
      startServerCommand: 'npm run preview -- --host 127.0.0.1 --port 4174 --strictPort',
      startServerReadyPattern: '127.0.0.1:4174',
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader',
        formFactor: 'desktop',
        screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.5 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci-desktop',
    },
  },
};