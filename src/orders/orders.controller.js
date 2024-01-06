const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res, next){
    res.json({data: orders});
};

function bodyDataHas(propertyName){
    return function (req, res, next){
        const { data = {} } = req.body;
        if(data[propertyName]){
            next();
        }else{
            next({
                status: 400,
                message: `Dish must include a ${propertyName}`
            });
        }
    }
};

function hasDishes(req, res, next){
    const {data: { dishes }} = req.body;
    if(Array.isArray(dishes) && dishes.length > 0){
        next();
    }else{
        next({
            status: 400,
            message: "Order must include at least one dish"
        });
    }
};

function dishesQuantityIsCorrect(req, body, next){
    const {data: { dishes }} = req.body;
    dishes.forEach((dish, index) => {
        const quantity = dish.quantity;
        if(!quantity || !Number.isInteger(quantity) || !(Number(quantity) > 0)){
            next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
    });
    next();
};

function create(req, res, next){
    const {data: {deliverTo, mobileNumber, dishes, status}} = req.body;
    const newOrder = {
        deliverTo,
        mobileNumber,
        dishes,
        status,
        id: nextId()
    }
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
};

function orderExists(req, res, next){
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if(foundOrder){
        res.locals.order = foundOrder;
        next();
    }else{
        next({
            status: 404,
            message: `Order Id not found: ${orderId}`
        });
    }
};

function read(req, res, next){
    res.json({data: res.locals.order});
};

function update(req, res, next){
    const {data: {deliverTo, mobileNumber, dishes, status}} = req.body;
    const order = res.locals.order;
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.dishes = dishes;
    order.status = status;
    res.json({data: order});
};

function validateStatus(req, res, next){
    const { data: { status }} = req.body;
    if(["pending", "preparing", "out-for-delivery", "delivered"].includes(status)){
        if(status === "delivered"){
            next({
                status: 400,
                message: "A delivered order cannot be changed"
            });
        }
        next();
    }else{
        next({
            status: 400,
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
        });
    }
};

function idBodyMatchesIdRoute(req, res, next){
    const bodyId = req.body.data.id;
    const routeId = req.params.orderId;
    if(bodyId === routeId || !bodyId){
        next();
    }else{
        next({
            status: 400,
            message: `Order id does not match route id. Order: ${bodyId}, Route: ${routeId}`
        });
    }
};

function isPending(req, res, next){
    const { status } = res.locals.order;
    if(status === "pending") next();
    next({
        status: 400,
        message: "An order cannot be deleted unless it is pending."
    });
}

function destroy(req, res, next){
    const index = orders.findIndex(order => order.id === res.locals.order.id);
    orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        hasDishes,
        dishesQuantityIsCorrect,
        create
    ],
    read: [orderExists, read],
    update: [
        orderExists,
        idBodyMatchesIdRoute,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        hasDishes,
        dishesQuantityIsCorrect,
        validateStatus,
        update
    ],
    delete: [orderExists, isPending, destroy]
}
