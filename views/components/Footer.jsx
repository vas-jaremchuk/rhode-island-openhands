// Site footer — reference/spec/02-design-system.md node map row 10 and
// reference/spec/04-frontend.md §Section layouts (Footer).
//
// Q-6: the Figma export is a flattened shape, a plain --c-footer block with no
// content, 354 px tall on desktop and 270 px on mobile. No text, links or Global
// fields.
export default function Footer() {
  return <footer className='c-footer' />;
}
