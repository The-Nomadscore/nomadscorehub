# feedback response (Phase 3)

At the end of Phase 2 we received  suggestions. This page records
what each one asked for, what we decided, where it lives in the code, and how
we checked it. It also lists what we chose not to do, and why.

## Done

| # | Panel suggestion | What we built | Where | How we verified |
|---|---|---|---|---|
| 1 | Landing page | No change, as the panel advised. | - | - |
| 2 | Compare more than 2 cities | Compare 2 to 4 cities side by side. Picking a fifth shows a "limit reached" message and offers to replace one. | `src/components/ComparisonDrawer.jsx`, `src/context/ComparisonContext.jsx` (C1, #__) | Smoke test 2 Nov: four columns, clear message on the fifth. |
| 3 | Numbered pagination with "Showing X to Y of N" | Six cities per page with numbered buttons. The count reflects search and filters, and the page resets to 1 when they change. | `src/components/Pagination.jsx`, `src/utils/paginate.js` (C2, #__) | Smoke test 2 Nov: counts match the filters, page resets. |
| 4 | Add itineraries to a calendar | A downloadable `.ics` file and a Google Calendar link on each itinerary. `end_date` is inclusive, so all-day events end one day later in both formats. | `src/utils/calendar.js`, `src/components/ItineraryCard.jsx` (C3, #166) | Smoke test 2 Nov: `.ics` opens in a calendar app; the Google link opens with the right dates. |
| 5 | Admin dashboard with counts and an add-city form | `/admin` shows user, city, shortlist and itinerary counts and a form to add a city with its 17 scores. | `src/pages/AdminPage.jsx`, `src/components/admin/` (D4,), `backend/app/api/admin.py` (D2, D3, #169) | Smoke test 2 Nov: non-admin gets 403, admin gets counts, a posted city appears on the site. D4 run by the reviewer. |

## Security work done alongside

Adding accounts made some feedback items depend on security decisions:

- Passwords are hashed. Tokens are JWTs with a one hour expiry. The secret comes from the environment.
- Shortlists and itineraries are per-user, and every private query filters by the signed-in user. A test proves user A cannot read user B's data.
- Admin rights are checked on the server (`admin_required`, reading the database on each request), not in the token or the UI. The first admin is created with `python -m app.make_admin <email>`, never through sign-up.
- The admin page hides itself from non-admins in the UI, but the server check is what protects the data.

## Deferred, and why

| Item | Decision | Reason |
|---|---|---|
| Email reminders | Deferred | Needs a mail service and a scheduler. The calendar export gives the same reminder through the user's own calendar. |
| Infinite scroll | Not done | The panel asked for numbered pagination with a count, which is easier to use with a keyboard and lets people see how many results there are. |
| Edit and delete cities | Deferred | Itineraries reference cities with `ON DELETE RESTRICT`, so deleting a used city is a design question, not just a button. Adding cities covers the panel's request. |
| Server-side pagination | Not done | The catalogue is small, so paging in the browser is fast and keeps filters simple. Revisit if the catalogue grows. |
| httpOnly cookies | Deferred | Needs CSRF protection and cross-site cookie setup between Vercel and Render. We use localStorage with a short token life, and we document the XSS trade-off in `docs/decisions.md`. |

## Known limits

- Frontend utilities (`calendar.js`, `paginate.js`) have no automated tests. We checked them by hand. The backend has a pytest suite, and CI requires it.
- The API runs on a free tier and takes about 50 seconds to wake after sleeping. 