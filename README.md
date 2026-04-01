# n8n-nodes-chitchase

[n8n](https://n8n.io) community node for **[ChitChase](https://chitchase.com)** — manage WhatsApp **message templates** (list, create, update, delete, sync) and **send** templates to a conversation or **broadcast** to multiple conversations.

**Source:** [github.com/chitchase/n8n-node-chitchase](https://github.com/chitchase/n8n-node-chitchase) (npm package name remains `n8n-nodes-chitchase` per n8n community node conventions).

## Install

### Community Nodes (recommended)

In n8n: **Settings → Community nodes → Install** and enter `n8n-nodes-chitchase`, or install from the community node browser if the package is verified.

### Manual / self-hosted

```bash
cd ~/.n8n/nodes  # or your custom nodes directory
npm install n8n-nodes-chitchase
```

See [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/installation/).

## Credentials

Create **ChitChase API** credentials:

| Field | Description |
| --- | --- |
| **API Token** | Bearer token from your ChitChase account settings |
| **Base URL** | Default `https://chitchase.com` (change only for staging/self-hosted) |
| **Default Phone Number ID** | WhatsApp phone number UUID in ChitChase — used for template dropdowns and optional filtering |

Use **Test** to call `GET /api/hello` and confirm the token. For stricter checks, set **Default Phone Number ID** and validate access in a workflow using **Template → List by Phone**.

## Node: ChitChase

### Resource: Template

| Operation | Description |
| --- | --- |
| **List Templates** | `GET /api/whatsapp-message-templates` with filters, pagination, optional “return all” |
| **List by Phone** | `GET /api/phone-numbers/{id}/templates` (rich translations / placeholders) |
| **Create** | `POST /api/whatsapp-message-templates` (flat payload: name, category, language, body, `body_example` JSON array, etc.) |
| **Update** | `PUT /api/whatsapp-message-templates/{id}` |
| **Delete** | `DELETE /api/whatsapp-message-templates/{id}` |
| **Sync From Meta** | `POST /api/whatsapp-message-templates/sync` |

Optional **Phone Number ID** on the node overrides the credential default (filters, dropdown data, `phone_number_id` on create).

### Resource: Message

| Operation | Description |
| --- | --- |
| **Send to Conversation** | `POST` multipart to `/api/conversations/{id}/messages/whatsapp-message-template` — requires **Meta template ID** (`meta_id`) plus optional ordered **parameters** and optional **header image** binary |
| **Broadcast** | `POST` multipart to `/api/groups/{group_id}/broadcast/send` — **template name + language** (manual or loaded from list), **conversation IDs**, optional parameters and header image |

### Template parameters (`{{1}}`, `{{2}}`, …)

Runtime values must match the **order** of placeholders in the approved template:

- **Fixed order**: add one row per value in **Values**.
- **JSON / Expression**: JSON array, e.g. `["Alice","Order #12"]` or `={{ [$json.name, $json.code] }}`.

### Broadcast template picker

Choose **Template → Choose From List** to load templates for the effective phone number ID (credential default or node override). **Send to Conversation** still requires **Meta template ID** separately when the API does not expose it on template list responses.

### Development

```bash
npm install
npm run build
npm run lint
npm run dev   # local n8n with hot reload
```

## Publish to npm (verified community node)

This package follows [Submit community nodes](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/):

- Keyword: `n8n-community-node-package`
- Publish with **GitHub Actions** and **npm provenance** (`publish.yml` + `npm run release`)
- Configure npm **Trusted Publishers** (or `NPM_TOKEN`) as described in `.github/workflows/publish.yml`
- From **May 1, 2026**, Creator Portal verification requires provenance publishing

Then submit the package in the **n8n Creator Portal**.

## API reference

OpenAPI export used during development: [`docs/chitchase-docs.json`](docs/chitchase-docs.json).

## License

MIT — see [LICENSE.md](LICENSE.md).
