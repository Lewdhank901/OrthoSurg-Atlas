function revealStage(hash) {
  const stage = document.getElementById(hash.slice(1));
  if (!(stage instanceof HTMLDetailsElement)) return;
  stage.open = true;
  stage.querySelector('summary').focus({ preventScroll: true });
  stage.scrollIntoView({ block: 'start' });
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-stage-link]');
  if (!link || event.defaultPrevented || event.button !== 0 ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  revealStage(link.hash);
});
window.addEventListener('hashchange', () => revealStage(location.hash));
if (location.hash) revealStage(location.hash);
