/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      url: [
        'http://127.0.0.1:4173/sunslide/',
      ],
      startServerCommand: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
      startServerReadyPattern: '127.0.0.1:4173',
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader',
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.3 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};