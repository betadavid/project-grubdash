const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res, next){
    res.json({ data: dishes });
};

function dishExists(req, res, next){
    const {dishId} = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if(foundDish){
        res.locals.dish = foundDish;
        next();
    }else{
        next({
            status: 404,
            message: `Dish does not exist: ${dishId}`
        });
    }
};

function read(req, res, next){
    res.json({data: res.locals.dish});
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
}

function priceIsCorrect(req, res, next){
    const { data: { price } } = req.body;
     if(Number.isInteger(price) && Number(price) > 0){
        next();
     }else{
        next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0"
        });
     }
}

function create(req, res, next){
    const {data: {name, description, price, image_url}} = req.body;
    const newDish = {
        name, description, price, image_url, id: nextId()
    };
    dishes.push(newDish)
    res.status(201).json({data: newDish});
};

function idBodyMatchesIdRoute(req, res, next){
    const bodyId = req.body.data.id;
    const routeId = req.params.dishId;
    if(bodyId === routeId || !bodyId){
        next();
    }else{
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${bodyId}, Route: ${routeId}`
        });
    }
};

function update(req, res, next){
    const {data: {name, description, price, image_url}} = req.body;
    const dish = res.locals.dish;
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({data: dish});
}

module.exports = {
    list,
    read: [dishExists, read],
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        priceIsCorrect,
        bodyDataHas("image_url"),
        create
    ],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        priceIsCorrect,
        bodyDataHas("image_url"),
        idBodyMatchesIdRoute,
        update
    ]
}