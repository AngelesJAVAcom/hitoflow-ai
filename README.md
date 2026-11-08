# HitoFlow AI

HitoFlow AI helps freelancers turn a client brief into a reviewable project plan with payment milestones. After the freelancer approves the plan, the app can create and send a PayPal Sandbox invoice for one of its milestones.

## Current prototype

- Generate one to three milestones with Gemini using structured JSON.
- Validate the milestone amounts, percentages, and dates on the server.
- Save projects and milestones in PostgreSQL as pending approval.
- Approve or reject a generated plan before billing.
- Review accepted, pending, and cancelled projects in the project history.
- Create and send a PayPal Sandbox invoice from an approved milestone.
- Review sent invoices and synchronize each invoice status with PayPal.
- Look up an invoice and receive PayPal webhooks; webhook signatures are verified and duplicate event IDs are ignored.

The Bryntum Gantt view, overdue rescheduling suggestions, hosted deployment, and end-to-end Sandbox payment verification are still pending. The prototype currently uses a project and milestone list instead of a Gantt chart.

## Stack

- Next.js, React, TypeScript, and Tailwind CSS
- Gemini API for project planning
- PostgreSQL for projects, milestones, and webhook events
- PayPal Invoicing API in Sandbox
- Zod for request and response validation

## Requirements

- Node.js and npm
- A PostgreSQL database with the `projects`, `milestones`, and `webhook_events` tables used by the API
- A Gemini API key
- A PayPal Developer app with Sandbox credentials

## Setup

```bash
npm install
```

Copy `.env.example` to `.env.local` and enter your local credentials. Keep `.env.local` out of Git. Use Sandbox credentials only during development.

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page generates and reviews a project plan. After approval, use **Facturación** to select one of its milestones and send an invoice.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Server-side access to Gemini |
| `PAYPAL_CLIENT_ID` | PayPal Sandbox application ID |
| `PAYPAL_CLIENT_SECRET` | PayPal Sandbox server credential |
| `PAYPAL_BASE_URL` | Sandbox API base URL (`https://api-m.sandbox.paypal.com`) |
| `PAYPAL_WEBHOOK_ID` | Webhook ID used to verify PayPal signatures |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port; defaults to `5432` |
| `DB_NAME` | PostgreSQL database name |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/ai/plan` | Generate, validate, and save a plan pending approval |
| `GET` | `/api/projects` | List projects and milestones |
| `PATCH` | `/api/projects/:id/approval` | Approve or reject a pending plan |
| `POST` | `/api/paypal/token` | Request a PayPal access token |
| `POST` | `/api/paypal/invoices` | Create and send an invoice for an approved milestone |
| `GET` | `/api/paypal/invoices/:id` | Read and synchronize invoice status |
| `POST` | `/api/paypal/webhooks` | Verify and process PayPal webhook events |

## Security notes

- Keep API keys and database credentials on the server in environment variables.
- Do not commit `.env.local`, credentials, or access tokens.
- Use PayPal Sandbox while building and demonstrating the prototype.
- Treat AI output as a proposal and require a human to review project plans before approval.
- Invoice amount and description are loaded from the approved database milestone, not trusted from browser input.

## Team

Built by Ángeles and Makk for the PayPal AI Hackathon 2026.

## License

No open-source license has been added yet. Add and verify the license before publishing the final submission.
