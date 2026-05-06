<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend Context

This directory contains the frontend application for Event Planner.

Before implementing product behavior, read the project documentation:

- Product context: `../docs/PRODUCT.md`
- Frontend routes, pages, states, and API usage: `../docs/FRONTEND.md`
- Backend API and domain rules: `../docs/BACKEND.md`
- Technology decisions: `../README.md`

Core project decisions:

- Use Next.js.
- Use npm.
- Use shadcn/ui and Tailwind CSS for the UI.
- Use React Hook Form and Zod for forms and validation when form work is needed.
- Use date-fns for date formatting when date utilities are needed.
- Use lucide-react for icons.
- The app is for closed events only; there is no public event catalog.
- Auth uses backend-issued access and refresh tokens stored in httpOnly cookies.
- Do not store auth tokens in localStorage.
- Frontend and backend are separate projects in one repository; do not introduce monorepo tooling.

Implementation guidance:

- Keep frontend behavior aligned with `../docs/FRONTEND.md`.
- Use backend routes and access rules from `../docs/BACKEND.md`.
- Treat organizer, invited user, participant, and admin as role contexts relative to an event.
- Regular users can see the organizer and accepted participants; only organizers see the participant management view with all statuses.
- Do not add browser E2E testing unless explicitly requested.
