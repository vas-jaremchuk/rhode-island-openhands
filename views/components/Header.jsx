// Site header — reference/spec/02-design-system.md node map row 1 and
// reference/spec/04-frontend.md §Section layouts (Header).
//
// A plain function, not a template: `apos` and `global` arrive as props
// (AGENTS.md, "Nunjucks → JSX Gotchas"). Desktop is the 65 px utility row over
// the hero plus the 92 px logo bar; below `lg` a 50 px logo-only bar (Q-5).
import { Button } from './ui.jsx';

// §Layout: the `lg` breakpoint, spelled out because a `media` attribute cannot
// read the Sass variables or the `--bp-*` custom properties.
const DESKTOP_MEDIA = '(min-width: 1200px)';

// One `<img>` for both designs: the mobile export is the `src`, the desktop
// export the `source` from `lg`. The attributes are the wordmark size from the
// node map (252 × 22); the mobile file has the same 252:22 ratio at 126 × 11.
function Wordmark({
  apos, desktop, mobile
}) {
  const url = (image) => image?.attachment
    ? apos.attachment.url(image.attachment, { size: 'full' })
    : null;
  const desktopUrl = url(desktop);
  const mobileUrl = url(mobile);
  const src = mobileUrl || desktopUrl;
  if (!src) {
    return null;
  }
  return (
    <picture className='c-header__logo'>
      {desktopUrl && mobileUrl
        ? <source media={DESKTOP_MEDIA} srcset={desktopUrl} />
        : null}
      <img
        className='c-header__logo-img'
        src={src}
        alt={desktop?.alt || mobile?.alt || ''}
        width='252'
        height='22'
      />
    </picture>
  );
}

export default function Header({ global, apos }) {
  const links = (global?.utilityLinks || [])
    .filter((link) => link.label && link.url);
  return (
    <header className='c-header'>
      <nav className='c-header__utility'>
        <div className='container container--wide c-header__utility-inner'>
          <ul className='c-header__links'>
            {links.map((link) => (
              <li className='c-header__item'>
                {link.style === 'outline'
                  ? (
                    <Button
                      apos={apos}
                      cta={{
                        label: link.label,
                        url: link.url
                      }}
                      variant='outline-white'
                    />
                  )
                  : <a className='c-header__link' href={link.url}>{link.label}</a>}
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className='c-header__bar'>
        <div className='container container--wide c-header__bar-inner'>
          <Wordmark
            apos={apos}
            desktop={global?._headerLogo?.[0]}
            mobile={global?._headerLogoMobile?.[0]}
          />
        </div>
      </div>
    </header>
  );
}
