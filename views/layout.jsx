// Top-level project layout. Extends Apostrophe's outerLayout — a Nunjucks
// template — through the bridge in `jsxRender.js`: each prop below becomes a
// {% block %} override on that template.
//
// Accepts these named props from page templates:
//
//   title  string used as the <title>, overriding the piece/page title
//   main   JSX node providing the page's content
//
// `data` is deliberately not destructured here. Props passed by a page
// template arrive as this template's data, so `data.main` is the `main` prop
// rather than anything belonging to the page document.
//
// The chrome comes from Global settings (reference/spec/03-backend.md §4):
// Header.jsx and Footer.jsx render it, and `beforeMain`/`afterMain` keep it
// inside Apostrophe's refreshable region so edits update it.
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

// <head> metadata from the Global SEO group. The canonical URL is the page's
// own path under the site's base URL, so a preview or edit query string never
// becomes canonical.
function Meta({
  global, data, apos
}) {
  const description = global.metaDescription?.trim();
  const ogImage = global._ogImage?.[0];
  const pagePath = data.page?._url;
  // `baseUrlWithPrefix` is empty when the request has no configured host, so
  // fall back to `baseUrl` (which Apostrophe always fills in).
  const baseUrl = data.baseUrlWithPrefix || data.baseUrl;
  const canonical = pagePath && baseUrl
    ? `${baseUrl}${pagePath}`
    : null;
  const ogImagePath = ogImage?.attachment
    ? apos.attachment.url(ogImage.attachment, { size: 'full' })
    : null;
  const ogImageUrl = ogImagePath && data.baseUrl
    ? `${data.baseUrl}${ogImagePath}`
    : ogImagePath;
  return (
    <>
      {description ? <meta name='description' content={description} /> : null}
      {ogImageUrl ? <meta property='og:image' content={ogImageUrl} /> : null}
      {canonical ? <link rel='canonical' href={canonical} /> : null}
    </>
  );
}

export default function (data, { Extend, apos }) {
  const global = data.global || {};

  // `data.title` is how a page template overrides the title — the JSX
  // equivalent of Nunjucks `{% block title %}`. Templates without a page or
  // piece in context (notFound.jsx) rely on it. The site title from Global is
  // the default for every page (reference/spec/03-backend.md §4 SEO group).
  const title = data.title ||
    global.siteTitle ||
    (data.piece && data.piece.title) ||
    (data.page && data.page.title);

  if (!title) {
    apos.util.log('Looks like you forgot to override the title block in a template that does not have access to an Apostrophe page or piece.');
  }

  return (
    <Extend
      templateName={data.outerLayout}
      title={title}
      extraHead={<Meta global={global} data={data} apos={apos} />}
      beforeMain={<Header global={global} apos={apos} />}
      main={<main className='c-main'>{data.main}</main>}
      afterMain={<Footer />}
    />
  );
}
