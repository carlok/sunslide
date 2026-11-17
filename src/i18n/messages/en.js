/** English UI strings (source locale). */
export default {
  'meta.pageTitle': 'Sunslide — sliding islands on a tiny planet',
  'meta.description':
    'Sunslide — hop as Pip the bubble frog on a tiny planet of 15 sliding meadow islands. Pop bubbles, outrun bats, and solve the sunlit 15-puzzle.',
  'meta.appAria': 'Sunslide game',
  'meta.stageAria': '3D planet view',
  'meta.failLoad':
    'The game bundle did not load. Try a hard refresh or run npm run build.',

  'menu.btnAria': 'Menu, credits and controls',
  'menu.title': 'Credits & settings',
  'menu.tutorialBtn': 'How to play',
  'menu.tutorialLead': ' — short 3-step tutorial',

  'settings.title': 'Settings',
  'settings.sound': 'Sound effects',
  'settings.music': 'Music',
  'settings.haptics': 'Haptics',
  'settings.qualityLabel': 'Quality',
  'settings.qualityAria': 'Graphics quality',
  'settings.quality.auto': 'Auto',
  'settings.quality.0': 'Low',
  'settings.quality.1': 'Medium',
  'settings.quality.2': 'High',
  'settings.reducedLabel': 'Reduced motion',
  'settings.reducedAria': 'Reduced motion',
  'settings.reduced.system': 'System',
  'settings.reduced.on': 'On',
  'settings.reduced.off': 'Off',
  'settings.colorBlind': 'Colour-blind friendly palette',
  'settings.languageLabel': 'Language',
  'settings.languageAria': 'Interface language',

  'credits.p1':
    '<strong>Sunslide</strong> — hop as Pip the bubble frog on a tiny planet: a sunlit <b>15-puzzle of sliding meadow islands</b>. © <a href="https://github.com/carlok" rel="noopener noreferrer">carlok</a>.',
  'credits.p2': 'Slide the meadow islands (a 15-puzzle) to collect bubbles and turn the planet green.',
  'credits.p3':
    'Source <a href="https://github.com/carlok/sunslide/blob/main/LICENSE" rel="noopener noreferrer">Apache-2.0</a>. Built with <a href="https://threejs.org/" rel="noopener noreferrer">three.js</a> (MIT) and Vite.',
  'credits.linkRepo': 'github.com/carlok/sunslide',

  'keyshelp.kbd':
    '<b>Arrows / WASD</b> hop · <b>Space</b> or <b>wheel</b> planet view · <b>P</b> pause · <b>M</b> music',
  'keyshelp.map':
    '<b>Click the map</b> to slide an island or set a waypoint',
  'keyshelp.pad':
    '<b>Gamepad</b>: stick/D-pad hop · <b>LB/RB</b> pick island · <b>A</b> slide · <b>X/Y</b> view · <b>Start</b> pause · <b>Select</b> music',
  'keyshelp.aria': 'Control reference',

  'toolbar.aria': 'Game controls',
  'toolbar.viewAria': 'Toggle planet view',
  'toolbar.pauseAria': 'Pause game',
  'toolbar.resumeAria': 'Resume game',
  'toolbar.musicAria': 'Toggle music',

  'hud.overlayAria': 'Game HUD',
  'hud.greenAria': 'Planet greening',
  'hud.score': 'Score',
  'hud.sector': 'Sector',
  'hud.bubbles': 'Bubbles',
  'hud.home': 'Home',
  'hud.lives': 'Lives',
  'hud.livesAria': '{count} lives left',
  'hud.statusAria': 'Day phase and hints',
  'hud.chip.day': 'DAY',
  'hud.chip.twilight': 'TWILIGHT',
  'hud.chip.night': 'NIGHT',
  'hud.greenPctAria': '{pct} planet green',

  'map.toggle': 'Map',
  'map.toggleAria': 'Show island map',
  'map.toggleAriaHide': 'Hide island map',
  'map.canvasAria':
    'Island map: tap to slide an adjacent island or set a waypoint',
  'map.caption': 'Map · tap: slide / waypoint',

  'pad.aria': 'Direction pad',
  'pad.up': 'Up',
  'pad.left': 'Left',
  'pad.view': 'VIEW',
  'pad.viewAria': 'Toggle planet view',
  'pad.right': 'Right',
  'pad.down': 'Down',

  'title.tagline':
    'Slide the meadow islands (a 15-puzzle) to collect bubbles and turn the planet green.',
  'title.b1':
    'Swipe, use the arrows or the pad to hop. Pop bubbles in a row for combos.',
  'title.b2':
    'Tap an island next to the empty meadow, on the planet or on the map, to slide it. Only sunlit islands move.',
  'title.b3':
    'Tap any other island on the map to set a waypoint. The map shows every bubble left.',
  'title.b4':
    'Each bat guards its own island: quick in the dark, drowsy in daylight.',
  'title.b5':
    'Slide an island to its home slot (1–15 in reading order): its bat sleeps and its bubbles score double.',
  'title.b6':
    'Clear an island and it blooms: flowers, trees and a beehive grow, and its bat flies away for good.',
  'title.b7':
    'Watch for cracks: a sinkhole drops you straight through to the other side of the planet.',
  'title.b8': 'Sky berries give a speed burst. Sunstones let you chase the bats.',
  'title.play': 'PLAY',
  'title.rules': 'How to play',
  'title.menuFoot': '☰ Menu for credits and full control reference · gamepads supported',

  'over.title': 'LIGHTS OUT',
  'over.again': 'AGAIN',
  'over.summary':
    'Score {score} · Sector {sector}<br>Best score {best}',

  'win.title': 'SECTOR CLEAR',
  'win.statsAria': 'Run summary',
  'win.moves': 'Moves',
  'win.time': 'Time',
  'win.greened': 'Tiles greened',
  'win.homes': 'Islands home',
  'win.newBest': 'New best!',
  'win.playAgain': 'Play again',
  'win.menu': 'Menu',
  'win.announceNew':
    'Sector clear. New best: {moves} moves in {time}.',
  'win.announce':
    'Sector clear. {moves} moves in {time}.',

  'pause.title': 'PAUSED',
  'pause.resume': 'RESUME',
  'pause.quality': 'Quality',
  'pause.view': 'View',
  'pause.sound': 'Sound',
  'pause.music': 'Music',
  'pause.restart': 'Restart',
  'pause.stateOn': 'On',
  'pause.stateOff': 'Off',
  'pause.soundLine': 'Sound: {state}',
  'pause.musicLine': 'Music: {state}',
  'pause.viewPlanet': 'View: Planet',
  'pause.viewClose': 'View: Close',
  'pause.qualityLine': 'Quality: {label}',

  'title.starsOne': '★ {total} star earned (optional par)',
  'title.starsMany': '★ {total} stars earned (optional par)',

  'tutorial.skip': 'Skip',
  'tutorial.next': 'Next',
  'tutorial.gotIt': 'Got it',
  'tutorial.counter': 'Step {current} of {total}',
  'tutorial.slide.title': 'Slide the meadow islands',
  'tutorial.slide.body':
    'This is a sunlit 15-puzzle: tap a glowing island next to the empty meadow (on the planet or the map) to slide that tile into the gap. Only lit islands move.',
  'tutorial.bubbles.title': 'Pop bubbles, grow green',
  'tutorial.bubbles.body':
    'Hop over bubbles to collect them. Each bubble you clear helps that island bloom — the tile turns greener as meadows spread.',
  'tutorial.goal.title': 'Your goal',
  'tutorial.goal.body':
    'Slide every island to its home slot (1–15) to put its bat to sleep, and clear all bubbles to finish the sector. Then hop onward to the next.',

  'hint.warp': 'Whoosh — straight through the planet!',
  'hint.sinkhole': 'Sinkhole ahead — turn away or fall through the planet!',
  'hint.fright': 'Bats are scared — catch them! {seconds}s',
  'hint.berryBoost': 'Berry speed! {seconds}s',
  'hint.berryRipe': 'A sky berry is ripe — follow the magenta arrow',
  'hint.batEyes': 'Bat island at night: watch for glowing eyes',
  'hint.lastBubbles': 'Follow the gold arrows to the last bubbles',
  'hint.waypoint': 'Follow the pink arrow to island {num}',
  'hint.islandDone': 'Island done — the gold arrow points to more bubbles',
  'hint.padSlide': 'LB/RB pick an island, A slides it',
  'hint.tapSlide': 'Tap a glowing island (or the map) to slide it',
  'hint.waitSun': 'Islands only slide in sunlight — wait for the sun',

  'errors.slide.sinkhole': 'Not while a sinkhole is open there',
  'errors.slide.notAdjacent': 'That island isn’t next to the empty meadow',
  'errors.slide.tooDark': 'Too dark — islands only slide in sunlight',
  'errors.slide.blocked': 'Wait — someone is crossing',

  'toast.graphicsReset':
    'Graphics reset by the browser — lowering quality',
  'toast.extraLife': 'Extra life!',
  'toast.combo': 'Combo ×{combo}!',
  'toast.sunstone': 'Sunstone! Chase the bats',
  'toast.islandCleared': 'Island {num} cleared! It blooms{bat}',
  'toast.islandClearedBat': ' and its bat flies off',
  'toast.berryIsland': 'A sky berry ripened on island {num}!',
  'toast.sinkhole': 'Sinkhole! Turn away!',
  'toast.whoosh': 'Whoosh!',
  'toast.islandHome': 'Island {num} is home!{tail}',
  'toast.islandHomeBat': ' Its bat falls asleep',
  'toast.islandHomeScore': ' Bubbles score ×2',
  'toast.allHome': 'All islands home! +3000',
  'toast.ready': 'READY',
  'toast.sector': 'SECTOR {level}',
  'toast.planetGreen': 'The planet is fully green!',
  'toast.sectorCleared':
    'SECTOR CLEARED · {stars} ({moves} moves, par {par})',
  'toast.waypointCleared': 'Waypoint cleared',
  'toast.waypointBloom': 'Island {num} is already in bloom',
  'toast.waypointOn': 'You are on island {num}',
  'toast.waypointSet':
    'Waypoint: island {num} — follow the pink arrow',
  'toast.padPickDark': '{num} is in the dark',
  'toast.padPickLit': '{num} selected — A to slide',
  'toast.gamepadOn':
    'Gamepad connected — stick to hop, LB/RB + A to slide',
  'toast.gamepadOff': 'Gamepad disconnected',

  'clear.meta': 'Sector {sector} · {moves} moves (par {par})',
  'clear.aria':
    'Sector {sector} cleared with {stars} of 3 stars, {moves} moves, par {par}',
};