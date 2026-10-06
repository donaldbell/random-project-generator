# Random Project Generator

A random ingredient roller for one-week rapid prototyping builds. Roll a brain, a sensor, a user, a vibe and a twist, lock what sparks something, re-roll the rest, and build it as far as it goes.

The page is a single static `index.html` that reads `pantry.json`. The pantry is edited in Airtable and synced here by a GitHub Action.

## Editing the pantry

Everything lives in the generator's Airtable base (base ID `appxsuF2T3tdbNWjk`):

- **Buckets**: one row per slot on the roller. `Order` sets the roll order, `Rolls by default` decides which buckets spin when you hit Roll, `Group` is Hardware, Human or Flavor.
- **Ingredients**: one row per option. Link it to a bucket, set `Level` (1 Easy, 2 Standard, 3 Showstopper), and tick `Retired` to take it out of the rolls without deleting it.
- **Episodes**: your own backlog of rolls worth building. Not published.

Buckets with no active ingredients are hidden on the public page, so you can set one up before filling it.

### Compatibility tags

`Provides` and `Needs` keep rolls sensible. Buckets roll in `Order`, and an ingredient only comes up if everything it needs was provided by an earlier pick. For example, Camera needs `camera-ok`, which only the ESP32-S3 provides. To add a new tag, type it into either field in Airtable.

## Publishing changes

The workflow in `.github/workflows/site.yml` pulls Airtable into `pantry.json`, commits it if anything changed, and deploys to GitHub Pages. It runs:

- daily at 05:17 UTC,
- on every push to `main`,
- when you press **Run workflow** on the Actions tab,
- when something sends a `sync-pantry` repository dispatch (for example an Airtable automation).

It needs one repository secret, `AIRTABLE_TOKEN`: an Airtable personal access token with the `data.records:read` scope, limited to that base. Without it, the workflow publishes the `pantry.json` already in the repo.

To run the sync locally:

```sh
AIRTABLE_TOKEN=pat... AIRTABLE_BASE=appxsuF2T3tdbNWjk node scripts/sync-pantry.mjs
```

## Embedding on another site

The page works inside an iframe, for example in a WordPress Custom HTML block:

```html
<iframe src="https://donaldbell.github.io/random-project-generator/" style="width:100%;height:1400px;border:0" title="Random Project Generator"></iframe>
```
