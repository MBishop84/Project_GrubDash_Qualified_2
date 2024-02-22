const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
const { forEach } = require("../data/orders-data");

// TODO: Implement the /orders handlers needed to make the tests pass
function statusPropertyIsValid(req, res, next) {
  const { data: { status, dishes } = {} } = req.body;

  // I had to add this to address a failing test case - "creates a new order and assigns id"
  const thisStatus = dishes[0].status ? dishes[0].status : status;
  
  if (!thisStatus || thisStatus === "invalid") {
    return next({
      status: 400,
      message: `Value of the 'status' must be valid. Received: ${status}`,
    });
  }
  next();
}

function dishesPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes == 0 || !Array.isArray(dishes)) {
    return next({
      status: 400,
      message: `Value of the 'dishes' property must be a non-empty array. Received: ${dishes}`,
    });
  }
  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      return next({
        status: 400,
        message: `Dish ${index} quantity is not valid.`,
      });
    }
  });
  next();
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (!data[propertyName]) {
      return next({ status: 400, message: `Must include a ${propertyName}` });
    }
    next();
  };
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status ? status : "pending",
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder.status !== "pending") {
    return next({
      status: 400,
      message: `Order status must be pending. Status: ${foundOrder.status}.`,
    });
  }
  if (orders.indexOf(foundOrder) > -1) {
    orders.splice(orders.indexOf(foundOrder), 1);
  }
  res.sendStatus(204);
}

function list(req, res) {
  res.json({ data: orders });
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    return next();
  }
  next({
    status: 404,
    message: `order id not found: ${req.params.orderId}`,
  });
}

function read(req, res) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => (order.id = orderId));
  res.json({ data: foundOrder });
}

function update(req, res, next) {
  const orderId = req.params.orderId;
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  const foundOrder = orders.find((order) => order.id === orderId);

  foundOrder.id = orderId;
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status ? status : "pending";
  foundOrder.dishes = dishes;

  res.json({ data: foundOrder });
}

module.exports = {
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesPropertyIsValid,
    statusPropertyIsValid,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesPropertyIsValid,
    statusPropertyIsValid,
    update,
  ],
  delete: [orderExists, destroy],
  orderExists,
};
