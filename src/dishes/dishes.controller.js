const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function pricePropertyIsValid(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (price > 0 && typeof price === "number") {
        return next();
    }
    next({
        status: 400,
        message: `Value of the 'price' property must be greater than zero. Received: ${price}`,
    });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  res.locals.id = nextId();
  res.locals.name = name;
  res.locals.description = description;
  res.locals.price = price;
  res.locals.image_url = image_url;
  dishes.push(res.locals);
  res.status(201).json({ data: res.locals });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function list(req, res) {
  res.json({ data: dishes });
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    return next();
  }
  next({
    status: 404,
    message: `dish id not found: ${req.params.dishId}`,
  });
}

function read(req, res) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => (dish.id = dishId));
  res.json({ data: foundDish });
}

function update(req, res, next) {
  const dishId = req.params.dishId;
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  if(id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  res.locals.dish = dishes.find((dish) => dish.id === dishId);

  res.locals.dish.id = dishId;
  res.locals.dish.name = name;
  res.locals.dish.description = description;
  res.locals.dish.price = price;
  res.locals.dish.image_url = image_url;

  res.json({ data: res.locals.dish });
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    pricePropertyIsValid,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    pricePropertyIsValid,
    update,
  ],
  dishExists,
};
