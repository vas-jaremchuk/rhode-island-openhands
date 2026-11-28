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
import news from './seed/news.js';
import community from './seed/community.js';
import partners from './seed/partners.js';

const IMAGE_DIR = 'fixtures/images';
const DB_FILE_SUFFIXES = [ '', '-wal', '-shm' ];
// Contact submissions are kept for 365 days (Q-7).
const DEFAULT_PURGE_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

export default {
  tasks(self) {
    return {
      seed: {
        usage: 'node app site:seed\n\nCreates the admin user, imports the media library, fills Global settings, adds the news items, community posts and college partners, and ensures the home page is published. Safe to run twice.',
        async task() {
          await self.seed();
        }
      },
      reset: {
        usage: 'node app site:reset\n\nDeletes the SQLite database and public/uploads, then seeds. Refused when NODE_ENV=production.',
        async task() {
          await self.reset();
        }
      },
      'purge-submissions': {
        usage: 'node app site:purge-submissions --days=N\n\nDeletes contact form submissions older than N days. Defaults to 365 (Q-7).',
        async task(argv) {
          return self.purgeSubmissions(argv);
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
        await self.seedNews(req);
        await self.seedCommunity(req);
        await self.seedPartners(req);
        await self.ensureHomePage(req);
        self.apos.util.log('site:seed: admin, images, Global settings, news items, community posts, college partners and home page are in place');
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
        // Q-10: the Contact group. Empty fields are filled, so a fresh database
        // shows the default recipients, areas and success message.
        if (!current.contactRecipients) {
          patch.contactRecipients = globalSettings.contactRecipients;
        }
        if (!current.areasOfInterest?.length) {
          patch.areasOfInterest = globalSettings.areasOfInterest;
        }
        if (!current.successMessage) {
          patch.successMessage = globalSettings.successMessage;
        }
        for (const [ field, title ] of [
          [ '_headerLogo', globalSettings.headerLogo ],
          [ '_headerLogoMobile', globalSettings.headerLogoMobile ],
          [ '_ogImage', globalSettings.ogImage ],
          [ '_defaultAvatar', globalSettings.defaultAvatar ]
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

      // The three News & Events cards of the Figma frame. The explicit slug in
      // `seed/news.js` is the idempotency key, because two cards share a title.
      async seedNews(req) {
        const newsModule = self.apos.modules['news-item'];
        for (const item of news) {
          const existing = await newsModule.find(req, { slug: item.slug }).toObject();
          if (!existing) {
            await newsModule.insert(req, {
              ...item
            });
          }
        }
      },

      // The three community posts of the Figma frame. The explicit slug in
      // `seed/community.js` is the idempotency key; the image is looked up in
      // the media library by the title `seedImages` imported it under.
      async seedCommunity(req) {
        const communityModule = self.apos.modules['community-post'];
        for (const { image, ...post } of community) {
          const existing = await communityModule
            .find(req, { slug: post.slug }).toObject();
          if (existing) {
            continue;
          }
          const imagePiece = await self.findImageByTitle(req, image);
          if (!imagePiece) {
            throw new Error(`site:seed: the image "${image}" for "${post.slug}" is missing`);
          }
          await communityModule.insert(req, {
            ...post,
            _image: [ imagePiece._id ]
          });
        }
      },

      // The five college partners of the Figma logo strip, in strip order. The
      // explicit slug in `seed/partners.js` is the idempotency key; the logo is
      // looked up in the media library by the title `seedImages` imported it
      // under.
      async seedPartners(req) {
        const partnerModule = self.apos.modules['college-partner'];
        for (const { image, ...partner } of partners) {
          const existing = await partnerModule
            .find(req, { slug: partner.slug }).toObject();
          if (existing) {
            continue;
          }
          const imagePiece = await self.findImageByTitle(req, image);
          if (!imagePiece) {
            throw new Error(`site:seed: the image "${image}" for "${partner.slug}" is missing`);
          }
          await partnerModule.insert(req, {
            ...partner,
            _logo: [ imagePiece._id ]
          });
        }
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
      },

      // Deletes every `contact-submission` created more than `days` days ago
      // and returns `{ days, deleted }`. The retention period is 365 days
      // (Q-7); the task runs outside the app on a schedule
      // (reference/spec/03-backend.md §8).
      async purgeSubmissions({ days = DEFAULT_PURGE_DAYS } = {}) {
        const retentionDays = typeof days === 'number' ? days : Number.parseInt(days, 10);
        if (!Number.isInteger(retentionDays) || retentionDays < 0) {
          throw new Error(`site:purge-submissions: --days must be a non-negative integer, got "${days}"`);
        }
        const cutoff = new Date(Date.now() - retentionDays * DAY_MS);
        const req = self.apos.task.getReq({ mode: 'published' });
        const submissions = await self.apos.modules['contact-submission']
          .find(req, {
            createdAt: {
              $lt: cutoff
            }
          })
          .toArray();
        for (const submission of submissions) {
          await self.apos.doc.delete(req, submission);
        }
        self.apos.util.log(`site:purge-submissions: deleted ${submissions.length} submission(s) older than ${retentionDays} day(s)`);
        return {
          days: retentionDays,
          deleted: submissions.length
        };
      }
    };
  }
};
