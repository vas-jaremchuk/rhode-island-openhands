// CLI tasks that build the demo site. `site:seed` is idempotent: it creates the
// admin, imports the Figma images into the media library and makes sure the home
// page exists and is published, so `npm run setup` always shows the current site.
// Seed content lives in `seed/*.js` data files, one per area of the site, so a
// later Task adds an entry instead of a code path.
import { spawnSync } from 'node:child_process';
import {
  copyFile, readdir, rm
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import images from './seed/images.js';
import globalSettings from './seed/global.js';

const IMAGE_DIR = 'fixtures/images';
const DB_FILE_SUFFIXES = [ '', '-wal', '-shm' ];

export default {
  tasks(self) {
    return {
      seed: {
        usage: 'node app site:seed\n\nCreates the admin user, imports the media library and ensures the home page is published. Safe to run twice.',
        async task() {
          await self.seed();
        }
      },
      reset: {
        usage: 'node app site:reset\n\nDeletes the SQLite database and public/uploads, then seeds. Refused when NODE_ENV=production.',
        async task() {
          await self.reset();
        }
      }
    };
  },
  methods(self) {
    return {
      async seed() {
        // Published mode: the seed writes what anonymous visitors must see
        // (`.agents/skills/apostrophe-modules`, "Seed content").
        const req = self.apos.task.getReq({ mode: 'published' });
        await self.ensureAdmin(req);
        await self.seedImages(req);
        await self.seedGlobal(req);
        await self.ensureHomePage(req);
        self.apos.util.log('site:seed: admin, images, Global settings and home page are in place');
      },

      async ensureAdmin(req) {
        const existing = await self.apos.user.find(req, { username: 'admin' }).toObject();
        if (existing) {
          return existing;
        }
        return self.apos.user.insert(req, {
          username: 'admin',
          password: process.env.APOS_ADMIN_PASSWORD || 'admin',
          title: 'Admin',
          role: 'admin'
        });
      },

      async seedImages(req) {
        for (const {
          file, title, alt
        } of images) {
          await self.importImage(req, path.join(IMAGE_DIR, file), {
            title,
            alt
          });
        }
      },

      // Imports `file` (a path relative to the project root) as an image piece.
      // Idempotent by slug: the title decides the slug, so a second run finds the
      // piece instead of uploading the file again.
      async importImage(req, file, { title, alt = '' } = {}) {
        const imageModule = self.apos.modules['@apostrophecms/image'];
        const slug = `${imageModule.options.slugPrefix}${self.apos.util.slugify(title)}`;
        const existing = await imageModule.find(req, { slug }).toObject();
        if (existing) {
          return existing;
        }
        const filePath = path.resolve(self.apos.rootDir, file);
        // `attachment.insert` sanitizes an SVG in place, so upload a copy and
        // leave the committed fixture byte-identical.
        const isSvg = path.extname(filePath).toLowerCase() === '.svg';
        const uploadPath = isSvg
          ? path.join(tmpdir(), `site-seed-${self.apos.util.generateId()}.svg`)
          : filePath;
        if (isSvg) {
          await copyFile(filePath, uploadPath);
        }
        try {
          const attachment = await self.apos.attachment.insert(req, {
            name: path.basename(filePath),
            path: uploadPath
          });
          return await imageModule.insert(req, {
            title,
            alt,
            slug,
            attachment
          });
        } finally {
          if (isSvg) {
            await rm(uploadPath, { force: true });
          }
        }
      },

      // Fills the Global settings the layout reads (header wordmarks, utility
      // links, SEO). Only empty fields are written, so an editor's changes
      // survive a re-run and a second seed creates nothing.
      async seedGlobal(req) {
        const globalModule = self.apos.modules['@apostrophecms/global'];
        const current = await globalModule.findGlobal(req);
        if (!current) {
          throw new Error('site:seed: the global settings document is missing');
        }
        const patch = {};
        const relation = async (title) => {
          const image = await self.findImageByTitle(req, title);
          return image ? [ image ] : null;
        };
        if (!current.siteTitle) {
          patch.siteTitle = globalSettings.siteTitle;
        }
        if (!current.metaDescription) {
          patch.metaDescription = globalSettings.metaDescription;
        }
        if (!current.utilityLinks?.length) {
          patch.utilityLinks = globalSettings.utilityLinks;
        }
        for (const [ field, title ] of [
          [ '_headerLogo', globalSettings.headerLogo ],
          [ '_headerLogoMobile', globalSettings.headerLogoMobile ],
          [ '_ogImage', globalSettings.ogImage ]
        ]) {
          if (!current[field]?.length) {
            const value = await relation(title);
            if (value) {
              patch[field] = value;
            }
          }
        }
        if (Object.keys(patch).length === 0) {
          return current;
        }
        return globalModule.update(req, {
          ...current,
          ...patch
        });
      },

      // The media-library piece whose title the seed used to import it.
      async findImageByTitle(req, title) {
        const imageModule = self.apos.modules['@apostrophecms/image'];
        const slug = `${imageModule.options.slugPrefix}${self.apos.util.slugify(title)}`;
        return imageModule.find(req, { slug }).toObject();
      },

      // Parked pages are created at startup by `@apostrophecms/migration`, so
      // this normally finds the published home page. It repairs a database whose
      // home page was unpublished or removed.
      async ensureHomePage(req) {
        const existing = await self.apos.page.find(req, { slug: '/' }).toObject();
        if (existing) {
          return existing;
        }
        const draftReq = self.apos.task.getReq({ mode: 'draft' });
        const draft = await self.apos.page.find(draftReq, { slug: '/' }).toObject();
        if (draft) {
          await self.apos.page.publish(draftReq, draft);
        } else {
          await self.apos.page.implementParkAllInDefaultLocale();
        }
        const home = await self.apos.page.find(req, { slug: '/' }).toObject();
        if (!home) {
          throw new Error('site:seed: could not create or publish the home page');
        }
        return home;
      },

      async reset() {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('site:reset: refusing to run with NODE_ENV=production');
        }
        const uri = process.env.APOS_DB_URI || '';
        const match = /^sqlite:\/\/(.+)$/.exec(uri);
        if (!match) {
          throw new Error(`site:reset: expected a sqlite:// APOS_DB_URI, got "${uri}"`);
        }
        const dbFile = path.resolve(self.apos.rootDir, match[1]);
        await self.emptyUploads();
        // Close the SQLite handle before unlinking the file, then seed in a child
        // process: the running instance still points at the deleted inode, so it
        // cannot create and fill the new database itself.
        await self.apos.dbClient.close(false);
        await Promise.all(DB_FILE_SUFFIXES.map((suffix) => rm(dbFile + suffix, {
          force: true
        })));
        const seed = spawnSync(process.execPath, [ 'app', 'site:seed' ], {
          cwd: self.apos.rootDir,
          env: process.env,
          stdio: 'inherit'
        });
        if (seed.status !== 0) {
          throw new Error(`site:reset: site:seed exited with ${seed.status}`);
        }
      },

      async emptyUploads() {
        const uploads = path.join(self.apos.rootDir, 'public', 'uploads');
        const entries = await readdir(uploads).catch(() => []);
        await Promise.all(entries.map((entry) => rm(path.join(uploads, entry), {
          recursive: true,
          force: true
        })));
      }
    };
  }
};
