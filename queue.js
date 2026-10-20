export class FoodOrderQueue {
  #orders;
  #nextOrderNumber;

  constructor(state = {}) {
    const orders = state.orders ?? [];
    const nextOrderNumber = state.nextOrderNumber ?? 1;

    if (!Array.isArray(orders)) {
      throw new TypeError("Saved orders must be an array.");
    }

    if (!Number.isSafeInteger(nextOrderNumber) || nextOrderNumber < 1) {
      throw new TypeError("The next order number must be a positive integer.");
    }

    this.#orders = orders.map((order) => FoodOrderQueue.#validateOrder(order));
    this.#nextOrderNumber = nextOrderNumber;
  }

  get orders() {
    return this.#orders.map((order) => ({ ...order }));
  }

  add({ customerName, items, timePlaced = new Date().toISOString() }) {
    const customer = FoodOrderQueue.#requireText(customerName, "Customer name");
    const details = FoodOrderQueue.#requireText(items, "Order items");
    const placedAt = FoodOrderQueue.#requireText(timePlaced, "Order time");

    const order = {
      number: String(this.#nextOrderNumber),
      customerName: customer,
      items: details,
      timePlaced: placedAt,
    };

    this.#nextOrderNumber += 1;
    this.#orders.push(order);

    return { ...order };
  }

  serveNext() {
    return this.#orders.shift() ?? null;
  }

  cancel(orderNumber) {
    const index = this.#orders.findIndex(
      (order) => order.number === String(orderNumber),
    );

    if (index === -1) {
      return false;
    }

    this.#orders.splice(index, 1);
    return true;
  }

  get nextOrderNumber() {
    return this.#nextOrderNumber;
  }

  toJSON() {
    return {
      nextOrderNumber: this.#nextOrderNumber,
      orders: this.orders,
    };
  }

  static #validateOrder(order) {
    if (order === null || typeof order !== "object" || Array.isArray(order)) {
      throw new TypeError("A saved order must be an object.");
    }

    const number = FoodOrderQueue.#requireText(order.number, "Order number");
    if (!/^\d+$/.test(number)) {
      throw new TypeError("A saved order number must contain digits only.");
    }

    return {
      number,
      customerName: FoodOrderQueue.#requireText(
        order.customerName,
        "Customer name",
      ),
      items: FoodOrderQueue.#requireText(order.items, "Order items"),
      timePlaced: FoodOrderQueue.#requireText(order.timePlaced, "Order time"),
    };
  }

  static #requireText(value, label) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new TypeError(`${label} cannot be blank.`);
    }

    return value.trim();
  }
}
