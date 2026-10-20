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

test("updates an order without changing its number, time, or FIFO position", () => {
  const queue = new FoodOrderQueue();
  const first = queue.add(makeOrder("Jamie", "1 burger"));
  queue.add(makeOrder("Morgan", "2 salads"));

  const updated = queue.update(first.number, {
    customerName: "Jamie Parker",
    items: "1 burger, extra fries",
  });

  assert.deepEqual(updated, {
    ...first,
    customerName: "Jamie Parker",
    items: "1 burger, extra fries",
  });
  assert.deepEqual(
    queue.orders.map((order) => order.number),
    ["1", "2"],
  );
  assert.equal(queue.serveNext().items, "1 burger, extra fries");
});

test("rejects blank order updates without changing the saved order", () => {
  const queue = new FoodOrderQueue();
  const original = queue.add(makeOrder("Jamie", "1 burger"));

  assert.throws(
    () => queue.update(original.number, { customerName: "Jamie", items: " " }),
    /Order items cannot be blank/,
  );
  assert.deepEqual(queue.orders[0], original);
  assert.equal(queue.update("999", { customerName: "Jamie", items: "fries" }), null);
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
