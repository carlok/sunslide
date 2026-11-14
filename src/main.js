async function boot() {
  const { startSunslide } = await import('virtual:sunslide-game');
  startSunslide();
}
boot();