import * as Joi from "joi";
import * as jwt from "jsonwebtoken";
import * as functions from 'firebase-functions';

const locationSchema = Joi.object().keys({
    lat: Joi.number(),
    long: Joi.number(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    pinCode: Joi.number().required(),
});

const item = Joi.object().keys({
    id: Joi.string().required(),
    qty: Joi.number().required(),
    price: Joi.number().required(),
    name: Joi.string().required(),
    unit: Joi.string().required()
})
const variant = {
    images: Joi.alternatives(Joi.array().items(Joi.string()), Joi.string()),
    price: Joi.number().required(),
    quantity: Joi.alternatives(Joi.object().keys({
        value: Joi.number(),
        unit: Joi.string()
    }), Joi.string()).required(),
    stock: Joi.string().required(),
    status: Joi.string().valid('AVAILABLE', 'NOTAVAILABLE').required(),
}


export const validateUser = function (body: any) {
    let schema = {}
    const role: string = body.role;

    switch (role) {
        case 'STOREMANAGER':
            schema = Joi.object().keys({
                fullName: Joi.string().required(),
                contactNumber: Joi.string().required().min(10).max(15),
                email: Joi.string().min(5).required().email(),
                password: Joi.string().min(5).max(255).required(),
                role: Joi.string().required(),
                store:Joi.object().keys({
                    name:Joi.string().required(),
                    id:Joi.string().required(),
                }),
                location: Joi.alternatives(locationSchema, Joi.string(), Joi.array().items(locationSchema)).required(),
            });
            break;
        case 'DELIVERY':
            schema = Joi.object().keys({
                fullName: Joi.string().required(),
                contactNumber: Joi.string().required().min(10).max(15),
                email: Joi.string().min(5).required().email(),
                password: Joi.string().min(5).max(255).required(),
                role: Joi.string().required(),
                store:Joi.object().keys({
                    name:Joi.string(),
                    id:Joi.string(),
                }),
                location: Joi.alternatives(locationSchema, Joi.string(), Joi.array().items(locationSchema)).required(),
            });
            break;
        default:
            schema = Joi.object().keys({
                fullName: Joi.string().required(),
                contactNumber: Joi.string().required().min(10).max(15),
                location: Joi.alternatives(locationSchema, Joi.string(), Joi.array().items(locationSchema)).required(),
                email: Joi.string().min(5).required().email(),
                password: Joi.string().min(5).max(255).required(),
                role: Joi.string().required(),
                wallet: Joi.string(),
            });
    }

    return Joi.validate(body, schema);
};

export const validateAuth = function (body: any) {
    const Schema = Joi.object().keys({
        email: Joi.string().min(5).required().email(),
        password: Joi.string().min(5).max(255).required(),
    });
    return Joi.validate(body, Schema);
};

export const validateReset = function (body: any) {
    const Schema = Joi.object().keys({
        password: Joi.string().min(5).max(255).required(),
        oldPassword: Joi.string().min(5).max(255).required(),
        id: Joi.string().required(),
    });
    return Joi.validate(body, Schema);
};

export const generateAuthToken = function (user: { id: string, role: string }) {
    const secretKey = functions.config().authkey ? functions.config().authkey.key : 'abhishek8938';
    return jwt.sign(user, secretKey);
};

export const validateUserUpdate = function (body: any) {
    const schema = Joi.object().keys({
        fullName: Joi.string(),
        contactNumber: Joi.string().min(10).max(15),
        location: Joi.alternatives(locationSchema, Joi.array().items(locationSchema), Joi.string()),
        email: Joi.string().min(5).email(),
        rating:Joi.array().items(Joi.object().keys({
            data:Joi.array().items(Joi.number()),
            average:Joi.number()
        })),
        store:Joi.object().keys({name:Joi.string(), id:Joi.string()}),
        status: Joi.string(),
        id: Joi.string()
    });

    return Joi.validate(body, schema);
};

export const validateProduct = function (body: any) {
    const schema = Joi.object().keys({
        name: Joi.string().required(),
        manufacturer: Joi.string().required(),
        description: Joi.string().required(),
        features: Joi.string().required(),
        otherNames: Joi.alternatives(Joi.array().items(Joi.string()), Joi.string()),
        life: Joi.string().required(),
        rating: Joi.number().max(5).required(),
        category: Joi.string().required(),
        subCategories: Joi.alternatives(Joi.array().items(Joi.string()), Joi.string()).required(),
        subCategoryItem: Joi.alternatives(Joi.array().items(Joi.string()), Joi.string()).required(),
        taxable: Joi.boolean().required(),
        variants: Joi.array().items(variant),
    });
    return Joi.validate(body, schema);
};

export const validateStore = function (body: any) {
    const schema = Joi.object().keys({
        name: Joi.string().required(),
        location: Joi.alternatives(locationSchema, Joi.string(), Joi.array().items(locationSchema)).required(),
        products: Joi.alternatives(Joi.array().items(Joi.string()), Joi.array().items(Joi.object().keys({
            name: Joi.string().required(), //name + size
            id: Joi.string().required(),
            instock: Joi.string().required(), // TODO:update with each stock and order
            stock: Joi.array().items(Joi.object().keys({ timeStamp: Joi.string(), value: Joi.string() })).required(),
        }))).required(),
        storeManager: Joi.object().keys({ name: Joi.string().required(), id: Joi.string().required() }).required(),
        employees: Joi.array().items(Joi.object().keys({name:Joi.string(), id:Joi.string()})), // add when added or updated
    });
    return Joi.validate(body, schema);
};

export const validateStoreUpdate = function (body: any) {
    const schema = Joi.object().keys({
        name: Joi.string(),
        location: Joi.alternatives(locationSchema, Joi.string(), Joi.array().items(locationSchema)),
        products: Joi.alternatives(Joi.array().items(Joi.string()), Joi.array().items(Joi.object().keys({
            name: Joi.string().required(), //name + size
            id: Joi.string().required(),
            instock: Joi.string().required(), // TODO:update with each stock and order
            stock: Joi.array().items(Joi.object().keys({ timeStamp: Joi.string(), value: Joi.string() })).required(),
        }))),
        storeManager: Joi.object().keys({ name: Joi.string().required(), id: Joi.string().required() }),
        employees: Joi.array().items(Joi.object().keys({name:Joi.string(), id:Joi.string()})), // add when added or updated
    });
    return Joi.validate(body, schema);
};

export const validateProductUpdate = function (body: any) {
    const schema = Joi.object().keys({
        name: Joi.string(),
        id: Joi.string().required(),
        offer: Joi.object().keys({
            name: Joi.string(),
            id: Joi.string()
        }),
        description: Joi.string(),
        features: Joi.string(),
        otherNames: Joi.alternatives(Joi.array().items(Joi.string()), Joi.string()),
        life: Joi.string(),
        rating: Joi.string(),
        variants: Joi.array().items(Joi.string()),
        images: Joi.alternatives(Joi.array().items(Joi.string()), Joi.string()),
        price: Joi.number(),
        quantity: Joi.alternatives(Joi.object().keys({
            value: Joi.number(),
            unit: Joi.string()
        }), Joi.string()),
        stock: Joi.string(),
        status: Joi.string().valid('AVAILABLE', 'NOTAVAILABLE'),
        sales: Joi.string(),
    });

    return Joi.validate(body, schema);
};

export const validateGory = function (body: any) {
    const schema = Joi.object().keys({
        name: Joi.string().required(),
        key:Joi.string().valid('subCategories','categories','subCategoryItems').required(),
        parent:Joi.string()
    });
    return Joi.validate(body, schema);
};

export const validateOrder = function (body: any) {
    const schema = Joi.object().keys({
        customerName: Joi.string().required(),
        contact: Joi.string().required(),
        email: Joi.string().min(5).required().email(),
        cid: Joi.string().required(),
        location: locationSchema,
        vid: Joi.string(),
        items: Joi.array().items(item).required(),
        totalCost: Joi.number().required(),
        offer: Joi.object().keys({
            name: Joi.string(),
            id: Joi.string()
        }),
        discount: Joi.number().required(),
        finalCost: Joi.number().required(),
        orderRating: Joi.number(),
        orderType: Joi.string().required(),
        deliveryRating: Joi.number(),
        vendorRating: Joi.number(),
        status: Joi.string(),
        comment: Joi.string(),
        paymentStatus: Joi.string().required(),
        paymentType: Joi.string().required(),
        transactionId: Joi.string(),
        timeAssigned: Joi.date().required(),
        timeDelivered: Joi.date(),
        deliveryBoy: Joi.object().keys({
            contact: Joi.string().required(),
            email: Joi.string().min(5).email().required(),
        }),
        did: Joi.string(),
        vendor: Joi.object().keys({
            contact: Joi.string().required(),
            email: Joi.string().min(5).email().required(),
        }),
        vendorName: Joi.string(),
    });

    return Joi.validate(body, schema);
};

export const validateOrderUpdate = function (body: any) {
    const schema = Joi.object().keys({
        id: Joi.string().required(),
        customerName: Joi.string(),
        contact: Joi.string(),
        email: Joi.string().min(5).email(),
        cid: Joi.string(),
        location: locationSchema,
        vid: Joi.string(),
        items: Joi.array().items(item),
        totalCost: Joi.number(),
        offer: Joi.object().keys({
            name: Joi.string(),
            id: Joi.string()
        }),
        discount: Joi.number(),
        finalCost: Joi.number(),
        orderRating: Joi.number(),
        deliveryRating: Joi.number(),
        vendorRating: Joi.number(),
        status: Joi.string(),
        comment: Joi.string(),
        paymentStatus: Joi.string(),
        paymentType: Joi.string(),
        timeAssigned: Joi.date(),
        timeDelivered: Joi.date(),
        deliveryBoy: Joi.string(),
        did: Joi.string(),
        vendor: Joi.object().keys({
            contact: Joi.string(),
            email: Joi.string().min(5).email(),
        }),
        vendorName: Joi.string(),
    });

    return Joi.validate(body, schema);
};

export const validateOffer = function (body: any) {
    const schema = Joi.object().keys({
        name: Joi.string().required(),
        discount: Joi.number().required(),
        unit: Joi.string().required(),
        code: Joi.string().required()
    });

    return Joi.validate(body, schema);
};

export const validateCartUpdate = function (body: any) {
    const schema = Joi.object().keys({
        id: Joi.string().required(),
        items: Joi.array().items(item).required(),
        totalCost: Joi.number(),
        offer: Joi.object().keys({
            name: Joi.string(),
            id: Joi.string()
        }),
        discount: Joi.number(),
        cid: Joi.string()
    });

    return Joi.validate(body, schema);
};

export const validateSavedUpdate = function (body: any) {
    const schema = Joi.object().keys({
        id: Joi.string().required(),
        items: Joi.array().items(item).required(),
        cid: Joi.string()
    });

    return Joi.validate(body, schema);
};


