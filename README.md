# Food Order Queue

A responsive, cross-platform food-order queue built with HTML, CSS, and
vanilla JavaScript. The app demonstrates a first-in, first-out (FIFO) queue:
the oldest waiting order is always served next.

## Features

- Add orders with a customer name, food items, order number, and time placed.
- See waiting orders in arrival order, with the next order highlighted.
- Serve the oldest waiting order or cancel an individual order.
- Save the queue in this browser's local storage so it is available after a
  refresh or reopening the app in the same browser.
- Use the app on desktop and mobile screens.
- Run automated tests for queue behavior without installing test dependencies.

Storage is local to the current browser and device. This demonstration does not
have a server, user accounts, shared restaurant data, or cross-device sync.

## Run locally

Requires Node.js 18 or newer. No package installation is needed.

```sh
npm start
```

Then open [http://localhost:4173](http://localhost:4173) in a browser. To choose
a different port, set the `PORT` environment variable before running the
command.

## Run the queue tests

```sh
npm test
```

## Project files

- `index.html` — accessible page structure and order form.
- `styles.css` — responsive layout and visual styling.
- `app.js` — browser UI, rendering, and local-storage integration.
- `queue.js` — FIFO queue operations and order validation.
- `server.js` — small local development server using Node.js built-ins.
- `tests/queue.test.js` — automated queue behavior tests.
- `Queue_Applications_and_Food_Order_System.docx` — the separate overview of
  real-world queue applications and why queues are useful.

## Queue behavior

New orders are appended to the back of the queue. Serving removes the oldest
order at the front. Canceling a waiting order removes only that order and
preserves the relative order of everyone else. The queue is saved in browser
local storage; this provides persistence for a single browser, not a shared
multi-user restaurant system.
