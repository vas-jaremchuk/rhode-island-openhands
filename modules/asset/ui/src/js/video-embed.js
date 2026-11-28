// Click-to-play video — reference/spec/04-frontend.md §JavaScript and
// reference/spec/02-design-system.md §Components `video-embed`.
//
// The server renders only the poster and a play button. Nothing is requested
// from YouTube, YouTube no-cookie, ytimg or Vimeo until the visitor activates
// the button, and the iframe then plays with `autoplay=1` (Q-12 for the default
// URL). Widget players run again after every edit, so `initVideoEmbed` must be
// idempotent.

const YOUTUBE_HOSTS = new Set([ 'youtube.com', 'm.youtube.com', 'youtube-nocookie.com' ]);
const VIMEO_HOSTS = new Set([ 'vimeo.com', 'player.vimeo.com' ]);
const YOUTUBE_ID = /^[\w-]+$/;
const VIMEO_ID = /^\d+$/;

// Elements already enhanced, so a second player run cannot bind a second click
// listener and create a second iframe.
const initialised = new WeakSet();

function host(url) {
  return url.hostname.replace(/^www\./i, '').toLowerCase();
}

// `{ provider, id }` from the oEmbed URL stored in the `video.media` field, or
// `null` for an unknown provider. Recognised forms: youtube.com/watch?v=,
// youtu.be/<id>, vimeo.com/<id> (the issue's list) plus the matching embed URLs.
function parseVideoUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const name = host(url);
  const path = url.pathname.replace(/\/+$/, '');

  if (YOUTUBE_HOSTS.has(name)) {
    if (path === '/watch') {
      const id = url.searchParams.get('v');
      return id && YOUTUBE_ID.test(id)
        ? {
          provider: 'youtube',
          id
        }
        : null;
    }
    const match = /^\/(?:embed|shorts)\/([\w-]+)$/.exec(path);
    return match
      ? {
        provider: 'youtube',
        id: match[1]
      }
      : null;
  }

  if (name === 'youtu.be') {
    const id = path.slice(1);
    return id && YOUTUBE_ID.test(id)
      ? {
        provider: 'youtube',
        id
      }
      : null;
  }

  if (VIMEO_HOSTS.has(name)) {
    const match = /^\/(?:video\/)?(\d+)$/.exec(path);
    return match && VIMEO_ID.test(match[1])
      ? {
        provider: 'vimeo',
        id: match[1]
      }
      : null;
  }

  return null;
}

// §JavaScript: youtube-nocookie with `autoplay=1&rel=0`, Vimeo with
// `autoplay=1&dnt=1`.
function playerUrl({ provider, id }) {
  return provider === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`;
}

function play(el, button, video) {
  if (el.querySelector('iframe')) {
    return;
  }
  const iframe = document.createElement('iframe');
  iframe.className = 'c-video-embed__iframe';
  iframe.src = playerUrl(video);
  iframe.title = el.dataset.videoTitle || '';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  button.replaceWith(iframe);
  // The 40% overlay would sit on top of the player, so it is dropped once the
  // video starts (§Components `video-embed`).
  el.classList.add('c-video-embed--playing');
  // §JavaScript: move focus into the player so keyboard visitors know it loaded.
  iframe.focus();
}

// Unknown providers fall back to a plain link to the stored URL.
function linkToVideo(button, url) {
  const link = document.createElement('a');
  link.className = button.className;
  link.href = url;
  const label = button.getAttribute('aria-label');
  if (label !== null) {
    link.setAttribute('aria-label', label);
  }
  while (button.firstChild) {
    link.append(button.firstChild);
  }
  button.replaceWith(link);
}

export function initVideoEmbed(el) {
  if (!el || initialised.has(el)) {
    return;
  }
  initialised.add(el);

  const button = el.querySelector('button');
  const url = el.dataset.videoUrl;
  if (!button || !url) {
    return;
  }
  const video = parseVideoUrl(url);
  if (!video) {
    linkToVideo(button, url);
    return;
  }
  button.addEventListener('click', () => play(el, button, video));
}
