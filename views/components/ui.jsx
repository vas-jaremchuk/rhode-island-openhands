// Shared UI components — reference/spec/02-design-system.md §Components and
// reference/spec/04-frontend.md §Templates.
//
// These are plain functions, not templates: JSX here is server-side only and
// there is no reconciler. A component that needs `apos` or `__t` receives it as
// an explicit prop (AGENTS.md, "Nunjucks → JSX Gotchas"). Widgets import the
// named exports:
//
//   import { Button, SectionHeading } from '../../views/components/ui.jsx';

// The icon sprite is the only copy of every icon (Q-2). `apos.asset.url`
// points at the release directory in production and the dev namespace in
// development, so the `<use>` reference survives both.
export function Icon({
  name, label, apos
}) {
  return (
    <svg
      className='c-icon'
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
      focusable='false'
    >
      <use href={`${apos.asset.url('/modules/asset/icons.svg')}#${name}`} />
    </svg>
  );
}

// §Components: one heading element with the eyebrow and title as two spans,
// centred or left, blue or white. `level` is the schema's `headingLevel`
// (h2 by default; h3 inside another section).
export function SectionHeading({
  eyebrow, title, level = 'h2', align = 'center', tone = 'blue'
}) {
  if (!eyebrow && !title) {
    return null;
  }
  // The `headingLevel` select only offers h2 and h3; anything else falls back
  // to h2 so a bad value cannot produce an arbitrary tag.
  const Heading = level === 'h3' ? 'h3' : 'h2';
  const alignClass = align === 'left' ? 'left' : 'center';
  const toneClass = tone === 'white' ? 'white' : 'blue';
  return (
    <Heading className={`c-section-heading c-section-heading--${alignClass} c-section-heading--${toneClass}`}>
      {eyebrow && <span className='c-section-heading__eyebrow t-eyebrow'>{eyebrow}</span>}
      {title && <span className='c-section-heading__title t-title-xl'>{title}</span>}
    </Heading>
  );
}

// §Components: solid, outline-yellow and outline-white buttons. The label and
// URL come from the `cta()` preset; an empty one renders nothing, so an editor
// can add a widget before filling it in.
const BUTTON_VARIANTS = [ 'solid', 'outline-yellow', 'outline-white' ];

export function Button({
  cta, variant = 'solid', arrow = false, apos
}) {
  const label = cta?.label?.trim();
  const url = cta?.url?.trim();
  if (!label || !url) {
    return null;
  }
  const variantClass = BUTTON_VARIANTS.includes(variant) ? variant : 'solid';
  const newTab = Boolean(cta.newTab);
  return (
    <a
      className={`c-btn c-btn--${variantClass}`}
      href={url}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
    >
      <span className='c-btn__label'>{label}</span>
      {arrow ? <Icon apos={apos} name='arrow-right' /> : null}
    </a>
  );
}

// §Components: the "READ MORE" link under a card. Renders nothing without a
// URL and label.
export function LinkMore({ url, label }) {
  if (!url || !label) {
    return null;
  }
  return <a className='c-link-more' href={url}>{label}</a>;
}

// §Components `video-embed` and §Layout (video 1100 × 619 at the desktop
// design, 347 × 198 on mobile, play button 72 / 60): the poster sits under a
// 40% black overlay and a centred play button. `data-video-url` is the oEmbed
// URL from the field; `modules/asset/ui/src/js/video-embed.js` parses the
// provider id from it on click, so the page loads nothing from YouTube or Vimeo
// until then (Q-12). The button's name doubles as the iframe's `title`.
export function VideoEmbed({
  apos, video
}) {
  const url = video?.media?.url?.trim();
  const poster = video?._poster?.[0];
  const title = video?.title?.trim();
  if (!url || !poster) {
    return null;
  }
  const label = title ? `Play video: ${title}` : 'Play video';
  return (
    <div
      className='c-video-embed'
      data-video-embed
      data-video-url={url}
      data-video-title={title || undefined}
    >
      <Picture
        apos={apos}
        image={poster}
        sizes='(min-width: 1200px) 1100px, calc(100vw - 28px)'
      />
      <button className='c-video-embed__play' type='button' aria-label={label}>
        {/* The play-72/play-60 fixtures as one scalable glyph; the button's
            size from §Components scales it to 60 px on mobile. */}
        <svg
          className='c-video-embed__icon'
          viewBox='0 0 72 72'
          fill='none'
          aria-hidden='true'
          focusable='false'
        >
          <circle cx='36' cy='36' r='34.8615' stroke='currentColor' strokeWidth='2.27702' />
          <path d='M47.0312 35.7097L30.0474 45.5153L30.0474 25.904L47.0312 35.7097Z' fill='currentColor' />
        </svg>
      </button>
    </div>
  );
}

// Images always go through this component: `srcset` from Apostrophe's image
// sizes, `sizes` from the caller, intrinsic width and height to prevent layout
// shift, and `alt` from the image piece (reference/spec/04-frontend.md
// §Templates). `priority` turns off lazy loading and raises the fetch priority
// for the hero and the Facility poster.
export function Picture({
  apos, image, sizes, priority = false
}) {
  const attachment = image?.attachment;
  if (!attachment) {
    return null;
  }
  return (
    <img
      className='c-picture'
      src={apos.attachment.url(attachment, { size: 'full' })}
      srcset={apos.image.srcset(attachment) || undefined}
      sizes={sizes || undefined}
      width={apos.attachment.getWidth(attachment)}
      height={apos.attachment.getHeight(attachment)}
      alt={image.alt || ''}
      loading={priority ? 'eager' : 'lazy'}
      fetchpriority={priority ? 'high' : undefined}
      decoding={priority ? undefined : 'async'}
    />
  );
}
