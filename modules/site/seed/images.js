// Media library content for `site:seed`. `title` is the piece title and decides
// the slug (`image-<slugified title>`), which is the seed's idempotency key; the
// seed finds an existing piece by that slug instead of uploading the file again.
// `alt` is placeholder copy until Q-3 supplies final text, and empty for images
// the design uses as decoration (`reference/spec/04-frontend.md` §Images). The
// `-375` exports in `fixtures/images/` are the same artwork at another size or
// crop, and Apostrophe generates the responsive sizes from one file.
export default [
  // Header and hero
  {
    file: 'header-wordmark.svg',
    title: 'Organogenesis wordmark',
    alt: ''
  },
  {
    file: 'hero-background.jpg',
    title: 'Hero background',
    alt: ''
  },
  {
    file: 'hero-lockup.svg',
    title: 'Organogenesis 100-year lockup',
    alt: ''
  },

  // Facility
  {
    file: 'facility-video-poster.jpg',
    title: 'Facility video poster',
    alt: 'A technician testing equipment in an Organogenesis laboratory'
  },
  {
    file: 'facility-collage-centre.jpg',
    title: 'Facility collage: cleanroom technicians',
    alt: 'Two technicians in protective suits working with sample trays in a cleanroom'
  },
  {
    file: 'facility-collage-top-left.jpg',
    title: 'Facility collage: laboratory walkthrough',
    alt: 'A scientist in a lab coat explaining a manufacturing process beside a whiteboard'
  },
  {
    file: 'facility-collage-top-right.jpg',
    title: 'Facility collage: cleanroom equipment',
    alt: 'A technician in a cleanroom suit operating laboratory equipment'
  },
  {
    file: 'facility-collage-bottom-left.jpg',
    title: 'Facility collage: manufacturing suite',
    alt: 'A corridor of stainless steel manufacturing equipment in a cleanroom suite'
  },
  {
    file: 'facility-collage-bottom-right.jpg',
    title: 'Facility collage: cafeteria',
    alt: 'The employee cafeteria at the Organogenesis Rhode Island facility'
  },

  // Impact
  {
    file: 'impact-background.jpg',
    title: 'Impact background',
    alt: ''
  },
  {
    file: 'impact-video-poster.jpg',
    title: 'Impact video poster',
    alt: 'A speaker at a podium during the Organogenesis Rhode Island facility opening'
  },

  // Community
  {
    file: 'community-avatar.png',
    title: 'Organogenesis avatar',
    alt: ''
  },
  {
    file: 'community-post-facility.jpg',
    title: 'Community post: new facility',
    alt: 'Aerial view of the Organogenesis manufacturing facility in Smithfield, Rhode Island'
  },
  {
    file: 'community-post-governor.jpg',
    title: 'Community post: Governor Dan McKee',
    alt: 'Rhode Island Governor Dan McKee speaking at the Organogenesis facility opening'
  },
  {
    file: 'community-post-petrosinelli.jpg',
    title: 'Community post: Dr. Arthur-Paul Petrosinelli',
    alt: 'Portrait of Dr. Arthur-Paul Petrosinelli'
  },

  // Education
  {
    file: 'education-video-poster.jpg',
    title: 'Education video poster',
    alt: 'Guests posing for a photo at an Organogenesis Rhode Island event'
  },
  {
    file: 'partner-brown.png',
    title: 'Brown University logo',
    alt: 'Brown University'
  },
  {
    file: 'partner-ccri.png',
    title: 'Community College of Rhode Island logo',
    alt: 'Community College of Rhode Island'
  },
  {
    file: 'partner-providence.png',
    title: 'Providence College logo',
    alt: 'Providence College'
  },
  {
    file: 'partner-ric.png',
    title: 'Rhode Island College logo',
    alt: 'Rhode Island College'
  },
  {
    file: 'partner-uri.png',
    title: 'University of Rhode Island logo',
    alt: 'The University of Rhode Island'
  },

  // Careers
  {
    file: 'careers-image.jpg',
    title: 'Careers image',
    alt: 'A scientist in a white coat and blue gloves looks through a microscope in a laboratory'
  },

  // About
  {
    file: 'about-logo-mark.svg',
    title: 'About logo mark',
    alt: ''
  }
];
