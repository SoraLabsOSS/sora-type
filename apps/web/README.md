# Sora Type Web

The Next.js frontend for Sora Type. Font inspection and comparison run locally
in the browser by default.

## Shareable Compare short links

Compare sessions are **opt-in**. Selecting or comparing fonts does not upload
them. Files are sent to the Cloudflare Worker only after the user selects
**Create share link**.

The resulting URL has this form:

```text
/{locale}/compare?s={sessionId}
```

When creating a link, the web app:

1. Uploads both font files and the current left-side font size to
   `POST /sessions`.
2. Receives a random session ID.
3. Copies the short link to the clipboard, or displays it for manual copying
   if clipboard access is unavailable.

When someone opens the link, SWR loads the session metadata and both font files
from the API. The existing client-side compare pipeline then parses and
registers the fonts.

Shared font files are private-by-link rather than publicly listed. Sessions
that have not been accessed for more than 10 days are removed automatically
from D1 and R2 by the API cleanup cron.

Only both font files and one font-size value are shared. Custom text, active
tab, variable-axis values, line height, and independent left/right sizes are
not persisted.

## Configuration

Set the public Cloudflare Worker URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

For production, replace it with the deployed Worker origin. The Worker CORS
allowlist must include the web application's origin.

## Local development

Run the API Worker and web app in separate terminals:

```bash
# apps/api
bun run dev

# apps/web
bun run dev
```

The default local origins are:

- Web: `http://localhost:3000`
- API: `http://localhost:8787`
