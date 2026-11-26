---
name: apostrophe-modules
description: Build and change ApostropheCMS 4 piece types, widgets, page types, global settings, API routes, CLI tasks and seed content in a project that runs on SQLite.
---

Read the repository's `AGENTS.md` (and `ARCHITECTURE.md` when present) first; it is binding and wins over this skill. Docs: https://apostrophecms.com/docs/

**Shape of the project**

- `app.js` lists every project module as `'<name>': {}`. A folder in `modules/` that is not listed is not loaded.
- Follow the project's module syntax: ESM starter kits (`"type": "module"`) use `export default { … }` in `modules/<name>/index.js`; older projects use `module.exports`.
- Shared field definitions live in `lib/` (for example `lib/area.js` for the widget set of an area). Reuse them; don't copy field definitions between modules.
- Database: `APOS_DB_URI=sqlite://<path>` from `.env`. The SQLite file lives under `data/` and is never committed.

**Module types**

| Kind            | `extend`                                          | Notes                                                                                            |
| --------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Piece type      | `@apostrophecms/piece-type`                       | Content collection (news, people). Singular name. `options: { label, pluralLabel, sort, alias }` |
| Widget          | `@apostrophecms/widget-type`                      | Module name ends in `-widget`; in area data and players the type is the name without `-widget`   |
| Page type       | `@apostrophecms/page-type`                        | Also add `{ name, label }` to `modules/@apostrophecms/page/index.js` `options.types`             |
| Piece page      | `@apostrophecms/piece-page-type`                  | Index and show pages for a piece type                                                            |
| Global settings | `@apostrophecms/global` (configure, don't extend) | One document; templates read it as `global`                                                      |

**Fields**

- `fields: { add: { … }, group: { basics: { label, fields: [ … ] } } }`. Every field has `type` and `label`; use `help`, `def`, `required: true`, `if: { otherField: value }`.
- Types: `string` (`textarea: true` for plain multi-line), `integer`, `float`, `boolean`, `select` / `checkboxes` (`choices: [{ label, value }]`), `date`, `time`, `url`, `email`, `slug`, `color`, `range`, `oembed` (video URLs), `attachment`, `area` (`options: { widgets: { '<type>': {} }, max }`), `array` (`fields: { add }`, `titleField`), `object`, `relationship`.
- Relationship names start with `_` (`_image`, `_partners`): `withType: '@apostrophecms/image'` or a piece type, `max`. The value is always an array, even with `max: 1`, and it is joined at query time, not stored.
- Images are relationships to `@apostrophecms/image` pieces, not raw attachments, so editors reuse the media library and alt text.

**Server-side data for widgets**

- Load related content in the widget module, not in the template:
  ```js
  methods(self) {
    return {
      async load(req, widgets) {
        for (const widget of widgets) {
          widget._items = await self.apos.modules['news-item']
            .find(req, {}).sort({ date: -1 }).limit(widget.limit || 3).toArray();
        }
      }
    };
  }
  ```
- Always query through a module's `find(req, criteria)` with the request's `req`, so permissions, draft/published mode and locale apply. Never read docs with `self.apos.db.collection(...)` or `self.apos.doc.db`.

**API routes and tasks**

- `apiRoutes(self) { return { post: { submit: async (req) => { … } } } }` serves `POST /api/v1/<module>/submit`. Validate input with `self.apos.launder` or the schema (`self.apos.schema.convert(req, schema, input, output)`); throw `self.apos.error('invalid', { … })` for a 400.
- Every piece type has a REST API at `/api/v1/<module>` (session or API key). Set `publicApiProjection` only for data anonymous visitors may read.
- CLI tasks: `tasks(self) { return { seed: { usage: '…', async task(argv) { … } } } }`, run with `node app <module>:seed`. Inside, use `self.apos.task.getReq()` (admin) or `self.apos.task.getAnonReq()`.
- Data changes for existing sites go in a migration: `self.apos.migration.add('<unique-name>', async () => { … })` in `init`; run `node app @apostrophecms/migration:migrate`.
- Users: `echo '<password>' | node app @apostrophecms/user:add <username> admin`.

**Seed content**

- Seed is a CLI task and must be idempotent: find by a stable `slug` or a seed key before inserting.
- Insert with a published-mode request (`self.apos.task.getReq({ mode: 'published' })`) and confirm with `find(self.apos.task.getAnonReq(), …)` that anonymous visitors see it; if only a draft exists, call `self.apos.modules[name].publish(req, draft)`.
- Area values: `{ metaType: 'area', items: [ { _id: self.apos.util.generateId(), metaType: 'widget', type: '<widget type without -widget>', …fields } ] }`.
- Images: `const attachment = await self.apos.attachment.insert(req, { name, path })`, then insert an `@apostrophecms/image` piece with `{ title, alt, attachment }` and relate it.
- Update the seed in the same Task that adds or changes a field, so `npm run reset` (or the project's equivalent) always shows the feature.

**Workflow for a Task**

1. Read the Task spec, the project's `AGENTS.md` and the reference it cites (Figma node ids, `reference/`).
2. Copy the closest existing module; register it in `app.js`; add fields with labels and help text.
3. Add server tests for schema rules and `load`/API behaviour (boot Apostrophe on a throwaway SQLite file, see `apostrophe-pitfalls`).
4. Update the seed, then run the checks in `.factory/commands.json` order (`factory stack verify`).
5. Use `factory stack up` and the browser capability for anything that renders.
