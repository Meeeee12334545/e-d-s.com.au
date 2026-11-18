// Tells the server the film was played, once per visit, so EDS can see the
// link has been used. Nothing about the viewer is sent or kept.
const film = document.querySelector("video[data-played]");
film?.addEventListener("play", () => {
  fetch(film.dataset.played, { method: "POST", keepalive: true }).catch(() => {});
}, { once: true });
