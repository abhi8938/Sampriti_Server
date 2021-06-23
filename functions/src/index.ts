import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import * as cors from 'cors';
import * as bcrypt from "bcrypt";
import {
    validateUser,
    validateStore,
    validateAuth,
    generateAuthToken,
    validateReset,
    validateUserUpdate,
    validateProduct,
    validateProductUpdate,
    validateGory,
    validateOrder,
    validateOrderUpdate,
    validateOffer,
    validateCartUpdate,
    validateSavedUpdate,
} from "./Schemas";
import {
    addCart,
    addGory,
    addOffer,
    addOrder,
    addProduct,
    addStore,
    addSaved,
    addUser
} from "./Objects";
import {auth} from "./MiddleWare";
import Algo from "./Algo";

const service = new Algo();
const corsHandler = cors({origin: true});

admin.initializeApp();

//User

export const createUser = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const {error} = validateUser(request.body);
        if (error) {
            return response.status(201).send(error.details[0].message)
        }

        const users = await admin.firestore().collection('userx').where("email", "==", request.body.email).get();
        if (users.docs.length > 0) return response.status(201).send('Email Already Registered');

        const salt = await bcrypt.genSalt(10);
        const passwordEncrypted = await bcrypt.hash(request.body.password, salt);
        let keywords: Array<string> = service.generateKeywords(request.body.fullName).concat(service.generateKeywords(request.body.contactNumber).concat(service.generateKeywords(request.body.email)));

        const user = await admin.firestore().collection('userx').add(addUser(request.body, passwordEncrypted, keywords));
        if (request.body.role === 'CUSTOMER') {
            await admin.firestore().collection('carts').add(addCart({cid: user.id}));
            await admin.firestore().collection('saved').add(addSaved({cid: user.id}));
        }
        return response.status(200).send("User Created Successfully!");
    });
});
export const authenticate = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
        const {error} = validateAuth(request.body);
        if (error) {
            return response.status(201).send(error.details[0].message);
        }
        const users = await admin.firestore().collection('userx').where("email", "==", request.body.email).get();
        if (users.docs.length === 0) return response.status(201).send('Invalid Email Address');

        const userDoc = users.docs[0];
        const validPassword = await bcrypt.compare(request.body.password, userDoc.data().password);
        if (!validPassword) return response.status(201).send('Invalid Password');

        const token = generateAuthToken({id: userDoc.id, role: userDoc.data().role});
        return response.status(200).send(token);
    });
});
export const forgotPassword = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
        const users = await admin.firestore().collection('userx').where("email", "==", request.body.email).get();
        if (users.docs.length === 0) return response.status(201).send('Invalid Email Address');

        //TODO: Send message to resetPassword through webpage


        return response.status(200).send('Password changed successfully, Please login again');
    });
});
export const resetPassword = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
        const {error} = validateReset(request.body);
        if (error) {
            return response.status(201).send(error.details[0].message);
        }

        const user: any = await admin.firestore().collection('userx').doc(request.body.id).get();
        if (!user.exists) return response.status(201).send('User does not exist');

        const validPassword = await bcrypt.compare(request.body.oldPassword, user.data().password);
        if (!validPassword) return response.status(201).send('Invalid Current Password');

        const salt = await bcrypt.genSalt(10);
        const passwordEncrypted = await bcrypt.hash(request.body.password, salt);

        await admin.firestore().collection('userx').doc(request.body.id).set({
            password: passwordEncrypted
        }, {merge: true});

        return response.status(200).send('Password changed successfully, Please login again');
    });
});
export const getUsers = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
                let last = null;
                let first = null;
                let users
                if (request.headers.lastuser !== undefined) {
                    last = await admin.firestore().collection('userx').doc(request.headers.lastuser).get();
                    users = await admin.firestore()
                        .collection('userx')
                        .orderBy('createdAt')
                        .startAt(last)
                        .limit(20)
                        .get();

                } else if (request.headers.firstuser !== undefined) {
                    first = await admin.firestore().collection('userx').doc(request.headers.firstuser).get();
                    users = await admin.firestore()
                        .collection('userx')
                        .orderBy('createdAt')
                        .endAt(first)
                        .limit(20)
                        .get();
                } else {
                    users = await admin.firestore()
                        .collection('userx')
                        .orderBy('createdAt')
                        .limit(20)
                        .get();
                }
                console.log('first - last', first, last);

                if (users.docs.length === 0) return response.status(200).send([]);

                const list: any = [];
                users.docs.map(el => list.push({id: el.id, data: el.data()}));

                return response.status(200).send(list);
            }
            return response.status(201).send(decoded);
        }
    );
});
export const updateUser = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('userData', JSON.stringify(request.body));

            const {error} = validateUserUpdate(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const user = await admin.firestore().collection('userx').doc(request.body.id).get();
            if (!user.exists) return response.status(201).send('User does note exist or wrong id');

            const fullName = request.body.fullName;
            const contactNumber = request.body.contactNumber;
            const email = request.body.email;
            const location = request.body.location;
            const profilePic = request.body.profilePic;
            const wallet = request.body.wallet;
            const status = request.body.status;
            const service_type = request.body.service_type;
            const lastUpdated = admin.firestore.FieldValue.serverTimestamp();
            const password = request.body.password;
            const department = request.body.department;

            const data: any = {};
            data.lastUpdated = lastUpdated;
            if (fullName) {
                data.fullName = fullName;
            }
            if (contactNumber) {
                data.contactNumber = contactNumber;
            }
            if (email) {
                data.email = email;
            }
            if (location) {
                data.location = location;
            }
            if (profilePic) {
                data.profilePic = profilePic;
            }
            if (wallet) {
                data.wallet = wallet
            }
            if (status) {
                data.status = status;
            }
            if (service_type) {
                data.serviceType = service_type;
            }
            if (department) {
                data.department = department;
            }
            if (password) {
                const salt = await bcrypt.genSalt(10);
                const passwordEncrypted = await bcrypt.hash(password, salt);
                data.password = passwordEncrypted;
            }

            await admin.firestore().collection('userx').doc(request.body.id).set(data, {merge: true});

            return response.status(200).send('user Updated');
        }
        return response.status(201).send(decoded);
    });
});

//Products

export const createProduct = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateProduct(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }

            let variants: Array<any> = request.body.variants;
            const products = await admin.firestore()
                .collection('products')
                .where("name", "==", request.body.name)
                .where('manufacturer', '==', request.body.manufacturer)
                .get();
            if (products.docs.length > 0) return response.status(201).send('Product with same attributes already exist');
            if (variants === undefined) return response.status(201).send('Variants are required');
            const keywords: Array<string> = service.generateKeywords(request.body.name).concat(service.generateKeywords(request.body.manufacturer));
            /*TODO:make products depending on the variants.length(DONE)
            * create productDocument and add to collection(DONE)
            * store variantsIDS for other variant product and store in all productDocument.(DONE)
            * */
            const body: any = {
                name: request.body.name,
                manufacturer: request.body.manufacturer,
                category: request.body.category,
                description: request.body.description,
                features: request.body.features,
                otherNames: request.body.otherNames,
                subCategories: request.body.subCategories,
                life: request.body.life,
                rating: request.body.rating,
                taxable: request.body.taxable,
            }
            const promiseResp = variants.map(async (el: any, index: number) => {
                body.images = el.images
                body.price = el.price
                body.stock = el.stock
                body['quantity'] = el.quantity
                const document = await admin.firestore().collection('products').add(addProduct(body, keywords));
                return document.id
            });

            const variantIds = await Promise.all(promiseResp);
            const batch = admin.firestore().batch();
            variantIds.map((id: any) => {
                const ref = admin.firestore().collection('products').doc(id);
                batch.update(ref, {variants: variantIds})
            })
            await batch.commit();
            return response.status(200).send("Product Created Successfully!");
        }
        return response.status(201).send(decoded);

    });
});
export const getProducts = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
                let last = null;
                let first = null;
                let products;
                if (request.headers.lastproduct !== undefined) {
                    last = await admin.firestore().collection('products').doc(request.headers.lastproduct).get();
                    products = await admin.firestore()
                        .collection('products')
                        .orderBy('name')
                        .startAt(last)
                        .limit(20)
                        .get();

                } else if (request.headers.firstproduct !== undefined) {
                    first = await admin.firestore().collection('products').doc(request.headers.firstproduct).get();
                    products = await admin.firestore()
                        .collection('products')
                        .orderBy('name')
                        .endAt(first)
                        .limit(20)
                        .get();
                } else {
                    products = await admin.firestore()
                        .collection('products')
                        .orderBy('name', "asc")
                        .limit(20)
                        .get();
                }

                if (products.docs.length === 0) return response.status(200).send([]);

                const list: any = [];
                products.docs.map(el => list.push({id: el.id, data: el.data()}));

                return response.status(200).send(list);
            }
            return response.status(201).send(decoded);
        }
    );
});
export const updateProduct = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('productDataUpdated', JSON.stringify(request.body));

            const {error} = validateProductUpdate(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const product = await admin.firestore().collection('products').doc(request.body.id).get();
            if (!product.exists) return response.status(201).send('product does not exist or wrong id');

            const name = request.body.name;
            const images = request.body.images;
            const price = request.body.price;
            const offer = request.body.offer;
            const qty = request.body.qty;
            const description = request.body.description;
            const features = request.body.features;
            const life = request.body.life;
            const otherNames = request.body.otherNames;
            const rating = request.body.rating;
            const status = request.body.status;

            const data: any = {};

            if (name) {
                data.name = name;
            }
            if (images) {
                data.images = images;
            }
            if (price) {
                data.price = price;
            }
            if (offer) {
                data.offer = offer;
            }
            if (qty) {
                data.qty = qty;
            }
            if (description) {
                data.description = description
            }
            if (features) {
                data.features = features
            }
            if (life) {
                data.life = life
            }
            if (otherNames) {
                data.otherNames = otherNames
            }
            if (rating) {
                data.rating = rating
            }
            if (status) {
                data.status = status;
            }

            await admin.firestore().collection('products').doc(request.body.id).set(data, {merge: true});

            return response.status(200).send('product Updated');
        }
        return response.status(201).send(decoded);
    });
});

//Stores

export const createStore = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateStore(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }

            const products = await admin.firestore()
                .collection('stores')
                .where("name", "==", request.body.name)
                .where('contacts', '==', request.body.manufacturer)
                .get();
            if (products.docs.length > 0) return response.status(201).send('Store with same attributes already exist');
            const keywords: Array<string> = service.generateKeywords(request.body.name).concat(service.generateKeywords(request.body.name));

            await admin.firestore().collection('stores').add(addStore(request.body, keywords));
            return response.status(200).send("Store Created Successfully!");
        }
        return response.status(201).send(decoded);

    });
});
export const getStores = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
                let last = null;
                let first = null;
                let stores;
                if (request.headers.laststore !== undefined) {
                    last = await admin.firestore().collection('stores').doc(request.headers.laststore).get();
                    stores = await admin.firestore()
                        .collection('stores')
                        .orderBy('name')
                        .startAt(last)
                        .limit(20)
                        .get();

                } else if (request.headers.firststore !== undefined) {
                    first = await admin.firestore().collection('stores').doc(request.headers.firststore).get();
                    stores = await admin.firestore()
                        .collection('stores')
                        .orderBy('name')
                        .endAt(first)
                        .limit(20)
                        .get();
                } else {
                    stores = await admin.firestore()
                        .collection('stores')
                        .orderBy('name', "asc")
                        .limit(20)
                        .get();
                }

                if (stores.docs.length === 0) return response.status(200).send([]);

                const list: any = [];
                stores.docs.map(el => list.push({id: el.id, data: el.data()}));

                return response.status(200).send(list);
            }
            return response.status(201).send(decoded);
        }
    );
});
export const updateStores = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('storeUpdateStarted', JSON.stringify(request.body));

            const {error} = validateProductUpdate(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const product = await admin.firestore().collection('stores').doc(request.body.id).get();
            if (!product.exists) return response.status(201).send('Store does not exist or wrong id');

            const name = request.body.name;
            const images = request.body.images;
            const price = request.body.price;
            const offer = request.body.offer;
            const qty = request.body.qty;
            const description = request.body.description;
            const features = request.body.features;
            const life = request.body.life;
            const otherNames = request.body.otherNames;
            const rating = request.body.rating;
            const status = request.body.status;

            const data: any = {};

            if (name) {
                data.name = name;
            }
            if (images) {
                data.images = images;
            }
            if (price) {
                data.price = price;
            }
            if (offer) {
                data.offer = offer;
            }
            if (qty) {
                data.qty = qty;
            }
            if (description) {
                data.description = description
            }
            if (features) {
                data.features = features
            }
            if (life) {
                data.life = life
            }
            if (otherNames) {
                data.otherNames = otherNames
            }
            if (rating) {
                data.rating = rating
            }
            if (status) {
                data.status = status;
            }

            await admin.firestore().collection('stores').doc(request.body.id).set(data, {merge: true});

            return response.status(200).send('Store Updated');
        }
        return response.status(201).send(decoded);
    });
});

//Product Gories - 'subCategories' | 'categories' | 'subCategoryItems'

export const createGory = functions.https.onRequest(async (request, response) => {
    //key = 'subCategories' | 'categories' | 'subCategoryItems'
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateGory(request.body);
            if (error) return response.status(201).send(error.details[0].message)
            if ((request.body.key === 'subCategories' || request.body.key === 'subCategoryItems') && request.body.parent === undefined) return response.status(201).send('Parent is required');
            const gories = await admin.firestore()
                .collection(`${request.body.key}`)
                .where("name", "==", request.body.name)
                .get();
            if (gories.docs.length > 0) return response.status(201).send(request.body.key + ' with same attributes already exist');
            const keywords: Array<string> = service.generateKeywords(request.body.name);

            await admin.firestore().collection(request.body.key).add(addGory(request.body, keywords));
            return response.status(200).send(request.body.key + " created successfully!");
        }
        return response.status(201).send(decoded);
    });
});
export const getGories = functions.https.onRequest(async (request: any, response: any) => {
    // key = 'subCategories' | 'categories' | 'subCategoryItems', parent = id,
    return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
                let gories
                if ((request.headers.key === 'subCategories' || request.headers.key === 'subCategoryItems') && request.headers.parent !== undefined) {
                    gories = await admin.firestore().collection(`${request.headers.key}`).where('parent', '==', request.headers.parent).get()
                } else {
                    gories = await admin.firestore()
                        .collection(`${request.headers.key}`)
                        .orderBy('name', "asc")
                        .limit(50)
                        .get();
                }

                if (gories.docs.length === 0) return response.status(200).send([]);

                const list: any = [];
                gories.docs.map(el => list.push({id: el.id, data: el.data()}));

                return response.status(200).send(list);
            }
            return response.status(201).send(decoded);
        }
    );
});
export const deleteGory = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.body.key === undefined || request.body.id === undefined) return response.status(201).send('Key or id is missing');

            const category = await admin.firestore().collection(`${request.body.key}`).doc(request.body.id).get();
            if (!category.exists) return response.status(201).send(request.body.key.toUpperCase() + ' does not exist or wrong id');

            await admin.firestore().collection(`${request.body.key}`).doc(request.body.id).delete();

            return response.status(200).send(request.body.key.toUpperCase() + ' Deleted');
        }
        return response.status(201).send(decoded);
    });
});

//Offers/Discount

export const createOffer = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateOffer(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }

            const categories = await admin.firestore()
                .collection('offers')
                .where("name", "==", request.body.name)
                .where("code", "==", request.body.code)
                .get();
            if (categories.docs.length > 0) return response.status(201).send('Offer with same attributes already exist');

            await admin.firestore().collection('offers').add(addOffer(request.body));
            return response.status(200).send("Offer created successfully!");
        }
        return response.status(201).send(decoded);
    });
});
export const getOffers = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
                const categories = await admin.firestore()
                    .collection('offers')
                    .orderBy('name', "asc")
                    .limit(50)
                    .get();

                if (categories.docs.length === 0) return response.status(200).send([]);

                const list: any = [];
                categories.docs.map(el => list.push({id: el.id, data: el.data()}));

                return response.status(200).send(list);
            }
            return response.status(201).send(decoded);
        }
    );
});
export const deleteOffer = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {

            const category = await admin.firestore().collection('offers').doc(request.body.id).get();
            if (!category.exists) return response.status(201).send('Offer does not exist or wrong id');

            await admin.firestore().collection('offers').doc(request.body.id).delete();

            return response.status(200).send('Offer Deleted');
        }
        return response.status(201).send(decoded);
    });
});

//Orders

export const createOrder = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateOrder(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }

            const user = await admin.firestore().collection('userx').doc(request.body.cid).get();
            if (!user.exists) return response.status(201).send('customer does not exist or wrong id');


            let keywords: Array<string> = service.generateKeywords(request.body.customerName).concat(service.generateKeywords(request.body.contact)).concat(service.generateKeywords(request.body.email));

            await admin.firestore().collection('orders').add(addOrder(request.body, keywords));
            return response.status(200).send("Order Created Successfully!");
        }
        return
        return response.status(201).send(decoded);

    });
});
export const getOrders = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
                const products = await admin.firestore()
                    .collection('orders')
                    .orderBy('createdAt', "asc")
                    .limit(50)
                    .get();

                if (products.docs.length === 0) return response.status(200).send([]);

                const list: any = [];
                products.docs.map(el => list.push({id: el.id, data: el.data()}));

                return response.status(200).send(list);
            }
            return response.status(201).send(decoded);
        }
    );
});
export const updateOrder = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('orderDataUpdated', JSON.stringify(request.body));

            const {error} = validateOrderUpdate(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const order = await admin.firestore().collection('orders').doc(request.body.id).get();
            if (!order.exists) return response.status(201).send('order does not exist or wrong id');

            const customerName = request.body.customerName;
            const contact = request.body.contact;
            const email = request.body.email;
            const location = request.body.location;
            const items = request.body.items;
            const totalCost = request.body.totalCost;
            const offer = request.body.offer;
            const discount = request.body.discount;
            const finalCost = request.body.finalCost;
            const orderRating = request.body.orderRating;
            const deliveryRating = request.body.deliveryRating;
            const vendorRating = request.body.vendorRating;
            const status = request.body.status;
            const comment = request.body.comment;
            const paymentType = request.body.paymentType;
            const timeDelivered = request.body.timeDelivered;
            const deliveryBoy = request.body.deliveryBoy;
            const vendor = request.body.vendor;
            const vendorName = request.body.vendorName;

            const data: any = {};

            if (customerName !== undefined) {
                data.customerName = customerName;
            }
            if (contact !== undefined) {
                data.contact = contact;
            }
            if (email !== undefined) {
                data.email = email;
            }
            if (offer !== undefined) {
                data.offer = offer;
            }
            if (location !== undefined) {
                data.location = location;
            }
            if (items !== undefined) {
                data.items = items
            }
            if (totalCost !== undefined) {
                data.totalCost = totalCost
            }
            if (discount !== undefined) {
                data.discount = discount
            }
            if (finalCost !== undefined) {
                data.finalCost = finalCost
            }
            if (orderRating !== undefined) {
                data.orderRating = orderRating
            }
            if (deliveryRating !== undefined) {
                data.deliveryRating = deliveryRating
            }
            if (vendorRating !== undefined) {
                data.vendorRating = vendorRating
            }
            if (status !== undefined) {
                data.status = status;
            }
            if (comment !== undefined) {
                data.comment = comment
            }
            if (paymentType !== undefined) {
                data.paymentType = paymentType
            }
            if (timeDelivered !== undefined) {
                data.timeDelivered = timeDelivered
            }
            if (deliveryBoy !== undefined) {
                data.deliveryBoy = deliveryBoy
            }
            if (vendor !== undefined) {
                data.vendor = vendor
            }
            if (vendorName !== undefined) {
                data.vendorName = vendorName
            }

            await admin.firestore().collection('orders').doc(request.body.id).set(data, {merge: true});

            return response.status(200).send('product Updated');
        }
        return response.status(201).send(decoded);
    });
});

//Cart

export const updateCart = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('cartDataUpdated', JSON.stringify(request.body));

            const {error} = validateCartUpdate(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const product = await admin.firestore().collection('carts').doc(request.body.id).get();
            if (!product.exists) return response.status(201).send('cart does not exist or wrong id');

            const items = request.body.items;
            const offer = request.body.offer;
            const totalCost = request.body.totalCost;
            const discount = request.body.discount;

            const data: any = {};
            if (items !== undefined) {
                data.images = items;
            }
            if (offer !== undefined) {
                data.offer = offer;
            }
            if (totalCost !== undefined) {
                data.totalCost = totalCost;
            }
            if (discount !== undefined) {
                data.discount = discount;
            }

            await admin.firestore().collection('carts').doc(request.body.id).set(data, {merge: true});

            return response.status(200).send('Cart Updated');
        }
        return response.status(201).send(decoded);
    });
});

//Saved

export const updateSaved = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('savedDateUpdated', JSON.stringify(request.body));

            const {error} = validateSavedUpdate(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const product = await admin.firestore().collection('saved').doc(request.body.id).get();
            if (!product.exists) return response.status(201).send('Saved does not exist or wrong id');

            const items = request.body.items;

            const data: any = {};

            if (items !== undefined) {
                data.items = items;
            }


            await admin.firestore().collection('saved').doc(request.body.id).set(data, {merge: true});

            return response.status(200).send('Saved Updated');
        }
        return response.status(201).send(decoded);
    });
});
export const search = functions.https.onRequest((request, response) => {
    //require key = ' and keystring
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.keystring === undefined || request.headers.key === undefined) return response.status(201).send('keystring or key is undefined');
            const data = await admin.firestore()
                .collection(`${request.headers.key}`)
                .where('keywords', 'array-contains', request.headers.keystring)
                .limit(10)
                .get();
            if (data.docs.length === 0) {
                return response.status(200).send([]);
            }
            const list: any = [];
            data.docs.map(el => list.push({id: el.id, data: el.data()}));

            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    })
});
export const getSingleDocument = functions.https.onRequest((request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.key === undefined || request.headers.id === undefined) return response.status(201).send('key aur id is undefined');
            const doc = await admin.firestore()
                .collection(request.body.key)
                .doc(request.body.id)
                .get();
            if (!doc.exists) {
                return response.status(200).send([]);
            }
            return response.status(200).send({id: doc.id, data: doc.data()});
        }
        return response.status(201).send(decoded);
    })
});

