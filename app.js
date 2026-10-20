import { FoodOrderQueue } from "./queue.js";

const STORAGE_KEY = "counter-and-co-food-order-queue-v1";

const elements = {
  form: document.querySelector("#order-form"),
  customerName: document.querySelector("#customer-name"),
  items: document.querySelector("#order-items"),
  editDialog: document.querySelector("#edit-dialog"),
  editForm: document.querySelector("#edit-form"),
  editOrderId: document.querySelector("#edit-order-id"),
  editOrderNumber: document.querySelector("#edit-order-number"),
  editCustomerName: document.querySelector("#edit-customer-name"),
  editItems: document.querySelector("#edit-order-items"),
  closeEditDialog: document.querySelector("#close-edit-dialog"),
  cancelEdit: document.querySelector("#cancel-edit"),
  orderList: document.querySelector("#order-list"),
  queueCount: document.querySelector("#queue-count"),
  queuePanel: document.querySelector("#queue-panel"),
  emptyState: document.querySelector("#empty-state"),
  serveNext: document.querySelector("#serve-next"),
  todayDate: document.querySelector("#today-date"),
  actionFeedback: document.querySelector("#action-feedback"),
  toast: document.querySelector("#toast"),
};

let toastTimeout;
const queue = loadQueue();

elements.todayDate.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(new Date());

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const customerName = elements.customerName.value.trim();
  const items = elements.items.value.trim();

  if (!customerName || !items) {
    showToast("Please enter a customer name and their order.", "error");
    return;
  }

  try {
    const order = queue.add({ customerName, items });
    renderQueue();

    const saved = saveQueue();
    elements.form.reset();
    elements.customerName.focus();
    setActionFeedback(
      saved
        ? `Order #${order.number} was added to the kitchen queue and saved in this browser.`
        : `Order #${order.number} was added for this session, but browser storage is unavailable.`,
      saved ? "success" : "warning",
    );
    revealQueueOnSmallScreen();
  } catch (error) {
    showToast(`Could not add the order: ${error.message}`, "error");
  }
});

elements.serveNext.addEventListener("click", () => {
  const order = queue.serveNext();

  if (!order) {
    renderQueue();
    showToast("There are no waiting orders to serve.", "error");
    return;
  }

  renderQueue();
  const saved = saveQueue();
  setActionFeedback(
    saved
      ? `Order #${order.number} for ${order.customerName} was served. The updated queue is saved in this browser.`
      : `Order #${order.number} was served, but the updated queue could not be saved.`,
    saved ? "success" : "warning",
  );
});

elements.orderList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-order-action]");
  if (!button) {
    return;
  }

  const orderNumber = button.dataset.orderNumber;
  if (button.dataset.orderAction === "edit") {
    openEditOrder(orderNumber);
    return;
  }

  if (!queue.cancel(orderNumber)) {
    showToast(`Order #${orderNumber} is no longer waiting.`, "error");
    renderQueue();
    return;
  }

  renderQueue();
  const saved = saveQueue();
  setActionFeedback(
    saved
      ? `Order #${orderNumber} was canceled. The updated queue is saved in this browser.`
      : `Order #${orderNumber} was canceled, but the updated queue could not be saved.`,
    saved ? "success" : "warning",
  );
});

elements.editForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const order = queue.update(elements.editOrderId.value, {
      customerName: elements.editCustomerName.value,
      items: elements.editItems.value,
    });

    if (!order) {
      elements.editDialog.close();
      renderQueue();
      showToast("That order is no longer waiting in the queue.", "error");
      return;
    }

    renderQueue();
    const saved = saveQueue();
    elements.editDialog.close();
    setActionFeedback(
      saved
        ? `Order #${order.number} updated and saved. Its place in the queue is unchanged.`
        : `Order #${order.number} updated for this session, but browser storage is unavailable.`,
      saved ? "success" : "warning",
    );
  } catch (error) {
    showToast(`Could not update the order: ${error.message}`, "error");
  }
});

elements.closeEditDialog.addEventListener("click", () => {
  elements.editDialog.close();
});

elements.cancelEdit.addEventListener("click", () => {
  elements.editDialog.close();
});

function loadQueue() {
  try {
    const savedState = window.localStorage.getItem(STORAGE_KEY);
    const loadedQueue = new FoodOrderQueue(savedState ? JSON.parse(savedState) : {});
    renderQueue(loadedQueue);
    return loadedQueue;
  } catch (error) {
    const freshQueue = new FoodOrderQueue();
    renderQueue(freshQueue);
    showToast(
      `Could not load saved orders: ${error.message} New orders will be kept for this session.`,
      "error",
    );
    return freshQueue;
  }
}

function saveQueue() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error("Could not save the food-order queue.", error);
    return false;
  }
}

function renderQueue(currentQueue = queue) {
  const orders = currentQueue.orders;
  elements.orderList.replaceChildren();
  elements.emptyState.hidden = orders.length > 0;
  elements.serveNext.disabled = orders.length === 0;
  elements.queueCount.textContent =
    `${orders.length} ${orders.length === 1 ? "order" : "orders"} waiting`;

  const rows = orders.map((order, index) => createOrderRow(order, index === 0));
  elements.orderList.append(...rows);
}

function createOrderRow(order, isNext) {
  const row = document.createElement("tr");
  row.append(
    createCell(`#${order.number}`, "order-number"),
    createCell(order.customerName, "customer-name"),
    createCell(order.items, "order-items"),
    createCell(formatOrderTime(order.timePlaced), "order-time"),
    createOrderActionsCell(order.number, order.customerName),
  );

  if (isNext) {
    const badge = document.createElement("span");
    badge.className = "next-up";
    badge.textContent = "NEXT UP";
    row.cells[0].append(badge);
  }

  return row;
}

function createCell(text, className) {
  const cell = document.createElement("td");
  cell.className = className;
  cell.textContent = text;
  return cell;
}

function createOrderActionsCell(orderNumber, customerName) {
  const cell = document.createElement("td");
  cell.className = "order-actions";

  const editButton = document.createElement("button");
  editButton.className = "button button-edit";
  editButton.type = "button";
  editButton.dataset.orderAction = "edit";
  editButton.dataset.orderNumber = orderNumber;
  editButton.setAttribute(
    "aria-label",
    `Edit order #${orderNumber} for ${customerName}`,
  );
  editButton.title = "Edit order";
  editButton.textContent = "Edit";

  const cancelButton = document.createElement("button");
  cancelButton.className = "button button-cancel";
  cancelButton.type = "button";
  cancelButton.dataset.orderAction = "cancel";
  cancelButton.dataset.orderNumber = orderNumber;
  cancelButton.setAttribute(
    "aria-label",
    `Cancel order #${orderNumber} for ${customerName}`,
  );
  cancelButton.title = "Cancel order";
  cancelButton.textContent = "×";
  cell.append(editButton, cancelButton);
  return cell;
}

function openEditOrder(orderNumber) {
  const order = queue.orders.find((entry) => entry.number === orderNumber);
  if (!order) {
    renderQueue();
    showToast(`Order #${orderNumber} is no longer waiting.`, "error");
    return;
  }

  elements.editOrderId.value = order.number;
  elements.editOrderNumber.textContent = `#${order.number}`;
  elements.editCustomerName.value = order.customerName;
  elements.editItems.value = order.items;
  elements.editDialog.showModal();
  elements.editItems.focus();
}

function formatOrderTime(timePlaced) {
  const date = new Date(timePlaced);
  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function showToast(message, kind) {
  window.clearTimeout(toastTimeout);
  elements.toast.textContent = message;
  elements.toast.dataset.kind = kind;
  elements.toast.hidden = false;
  toastTimeout = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 4000);
}

function setActionFeedback(message, kind) {
  elements.actionFeedback.textContent = message;
  elements.actionFeedback.dataset.kind = kind;
  elements.actionFeedback.hidden = false;
}

function revealQueueOnSmallScreen() {
  if (!window.matchMedia("(max-width: 860px)").matches) {
    return;
  }

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  elements.queuePanel.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

renderQueue();
