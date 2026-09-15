# Task Deadline Tracker

Live on Render: https://a3-hungdao.onrender.com

A per-user task tracker built with Express, MongoDB, and Bootstrap. You log in with any username and password. If the account doesn't exist yet, one is created automatically and you're alerted that this happened. Once logged in, you can add, edit, and delete tasks, and every task automatically gets a `deadline` field computed on the server from its priority and creation date (high = +1 day, medium = +3 days, low = +7 days). Every user only ever sees their own tasks as data is scoped to the logged-in session on every route, not just hidden in the UI.

**Challenges**: The trickiest bug was that `express.static` auto-serves `index.html` for `GET /` by default, which silently bypassed my own login-check route, so a logged-in user would keep seeing the login page instead of being redirected to `/app`. Fixed by passing `{ index: false }` to `express.static` so my own route handles `/` instead. Deploying also surfaced a MongoDB Atlas connection issue on Render (a TLS handshake error) that didn't happen locally. It turned out to be related to the Node.js version Render was defaulting to (pinning `"node": "20.x"` in `package.json` resolved it) and the IP access originally belonged only to local IP (adding 0.0.0.0/0 to IP access resolved it)

**Authentication strategy**: plain username/password, with `bcryptjs` for password hashing and `express-session` for session cookies. I went with this over OAuth since the assignment explicitly allows picking the simplest option, and it made it straightforward to test data isolation between users.

**CSS framework**: Bootstrap 5, loaded via CDN in both pages. It handles essentially all of the visual styling: forms, buttons, cards, the task table, priority badges. My own `main.css` only adds a handful of layout tweaks (centering the login card, page spacing) on top of it.

## Technical Achievements
- **Middleware achievement**: two Express middleware packages beyond what ships with Express itself:
  - **helmet**: sets a range of security-related HTTP headers (like `X-Frame-Options` and `X-Content-Type-Options`) to reduce common web vulnerabilities.
  - **morgan**: logs each incoming HTTP request (method, path, status code, response time) to the console, which made debugging routes and the Render deploy issues significantly faster.

## Design/Evaluation Achievements
_Not attempted for this submission._