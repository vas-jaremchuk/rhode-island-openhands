// The media library accepts SVG for logos and the 100-year lock-up
// (reference/spec/03-backend.md §6 "SVG uploads"). Apostrophe lists `svg` in the
// default `images` file group and runs every upload through its DOMPurify
// sanitizer, which removes `<script>` elements and event attributes before the
// file is stored. Declaring the extension here keeps that contract explicit at
// the project level, so a future `fileGroups` override cannot drop it silently.
export default {
  options: {
    addFileGroups: [
      {
        name: 'images',
        extensions: [ 'svg' ]
      }
    ]
  }
};
