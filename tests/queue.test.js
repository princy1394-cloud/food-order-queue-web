import test from "node:test";
import assert from "node:assert/strict";

import { FoodOrderQueue } from "../queue.js";

const makeOrder = (customerName, items = "1 burger") => ({
  customerName,
  items,
  timePlaced: "2026-10-20T12:00:00.000Z",
});

test("adds orders to the back and assigns increasing order numbers", () => {
  const queue = new FoodOrderQueue();

  const first = queue.add(makeOrder("Jamie"));
  const second = queue.add(makeOrder("Morgan", "2 salads"));

  assert.equal(first.number, "1");
  assert.equal(second.number, "2");
  assert.deepEqual(
    queue.orders.map((order) => order.customerName),
    ["Jamie", "Morgan"],
  );
});

test("serves orders in first-in, first-out order", () => {
  const queue = new FoodOrderQueue();
  queue.add(makeOrder("Jamie"));
  queue.add(makeOrder("Morgan"));

  assert.equal(queue.serveNext().customerName, "Jamie");
  assert.equal(queue.serveNext().customerName, "Morgan");
  assert.equal(queue.serveNext(), null);
});

test("cancels only the selected waiting order and preserves queue order", () => {
  const queue = new FoodOrderQueue();
  queue.add(makeOrder("Jamie"));
  queue.add(makeOrder("Morgan"));
  queue.add(makeOrder("Riley"));

  assert.equal(queue.cancel("2"), true);
  assert.deepEqual(
    queue.orders.map((order) => order.customerName),
    ["Jamie", "Riley"],
  );
  assert.equal(queue.cancel("2"), false);
});

test("keeps removed order numbers unique when new orders arrive", () => {
  const queue = new FoodOrderQueue();
  queue.add(makeOrder("Jamie"));
  queue.serveNext();

  assert.equal(queue.add(makeOrder("Morgan")).number, "2");
});

test("rejects blank customer names and item descriptions", () => {
  const queue = new FoodOrderQueue();

  assert.throws(() => queue.add(makeOrder("  ")), /Customer name cannot be blank/);
  assert.throws(
    () => queue.add(makeOrder("Jamie", "  ")),
    /Order items cannot be blank/,
  );
});

test("round-trips queue state for browser storage", () => {
  const queue = new FoodOrderQueue();
  queue.add(makeOrder("Jamie"));
  queue.add(makeOrder("Morgan"));
  queue.serveNext();

  const restoredQueue = new FoodOrderQueue(JSON.parse(JSON.stringify(queue)));

  assert.equal(restoredQueue.nextOrderNumber, 3);
  assert.deepEqual(
    restoredQueue.orders.map((order) => order.customerName),
    ["Morgan"],
  );
  assert.equal(restoredQueue.add(makeOrder("Riley")).number, "3");
});
