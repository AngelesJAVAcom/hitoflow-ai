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
- Review project milestones in a read-only Bryntum Gantt timeline, including planned dates and payment status.
- Generate Gemini rescheduling proposals for overdue unpaid milestones; the user reviews and accepts before dates are saved.

The core Sandbox invoice and payment-status flow has been verified. Hosted deployment, final quality review, demo recording, and Devpost submission are still pending.

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
Use **Cronograma** to select a project and review its milestone dates and payment status in the Gantt view.

## Render deployment

The repository includes a Render Blueprint in `render.yaml`. It provisions a Node web service and a PostgreSQL database, runs the idempotent schema setup on service start, and keeps credentials out of Git. In Render, create a Blueprint from this repository and enter the requested Gemini and PayPal Sandbox secrets in the Dashboard.

The Blueprint currently uses Render's free plans for a hackathon demo. Free web services spin down when idle, and free PostgreSQL databases expire 30 days after creation. Upgrade PostgreSQL before relying on the hosted database for long-term storage. The database starts empty; it does not copy the local development records.

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
| `POST` | `/api/projects/:id/reschedule-suggestion` | Generate a reviewed proposal for overdue unpaid milestones |
| `PATCH` | `/api/projects/:id/reschedule` | Apply a confirmed rescheduling proposal |
| `POST` | `/api/paypal/token` | Request a PayPal access token |
| `POST` | `/api/paypal/invoices` | Create and send an invoice for an approved milestone |
| `GET` | `/api/paypal/invoices/:id` | Read and synchronize invoice status |
| `POST` | `/api/paypal/webhooks` | Verify and process PayPal webhook events |

## Security notes

- Keep API keys and database credentials on the server in environment variables.
- Do not commit `.env.local`, credentials, or access tokens.
- Use PayPal Sandbox while building and demonstrating the prototype.
- Treat AI output as a proposal and require a human to review project plans before approval.
- Rescheduling proposals are also reviewed before any dates are changed.
- Invoice amount and description are loaded from the approved database milestone, not trusted from browser input.

## Team

Built by Ángeles and Makk for the PayPal AI Hackathon 2026.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
