import * as admin from "firebase-admin";

type location = {
    lat?: number,
    long?: number,
    address: string,
    city: string,
    state: string,
    country: string,
    pinCode: number,
};

type item = {
    id: string,
    qty: number,
    price: number,
    name: string,
    unit: string
}

export const addUser = function (body: {
    fullName: string,
    contactNumber: string,
    email: string,
    role: string,
    rating?: number | { data: Array<number>, average: number },
    store?: { name: string, id: string }
    location: location | string | Array<location>,
}, passwordEncrypted: string, keywords: Array<string>) {
    const role = body.role;
    let data = {};
    switch (role) {
        case 'STOREMANAGER':
            data = {
                fullName: body.fullName,
                contactNumber: body.contactNumber,
                email: body.email,
                password: passwordEncrypted,
                role: body.role,
                status: 'ACTIVE',
                store: body.store,
                onDuty: false,
                keywords,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
            break;
        case 'DELIVERY':
            data = {
                fullName: body.fullName,
                contactNumber: body.contactNumber,
                email: body.email,
                password: passwordEncrypted,
                role: body.role,
                status: 'ACTIVE',
                onDuty: false,
                rating: 4,
                store: body.store ? body.store : {},
                keywords,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
            break;
        default:
            data = {
                fullName: body.fullName,
                contactNumber: body.contactNumber,
                email: body.email,
                password: passwordEncrypted,
                role: body.role,
                location: body.location,
                status: 'ACTIVE',
                keywords,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
    }
    return data
};

export const addProduct = function (body: {
    name: string,
    manufacturer: string,
    category: string,
    description: string,
    features: string,
    otherNames: Array<string> | string,
    subCategories: string | Array<string>,
    subCategoryItem: string | Array<string>,
    life: string,
    rating: number | { data: Array<number>, average: number },
    stock?: number | Array<{ timeStamp: Date, value: string }>,//Total stock bought with time of addition of stock
    taxable: string,
    price: string,
    images: string,
    quantity: string | { value: number, unit: string },
}, keywords: Array<string>) {
    return {
        name: body.name,
        code: body.name.toUpperCase(),
        manufacturer: body.manufacturer,
        category: body.category,
        description: body.description,
        features: body.features,
        otherNames: body.otherNames,
        life: body.life,
        rating: body.rating,
        keywords: keywords,
        status: 'AVAILABLE',
        sales: 0, // update with each order of product
        stock: body.stock,
        taxable: body.taxable,
        price: body.price,
        quantity: body.quantity,
        images: body.images,
        subCategories: body.subCategories,
        subCategoryItem:body.subCategoryItem,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
}

export const addStore = function (body: {
    name: string,
    location: location | string,
    products: Array<string> | Array<{
        name: string, //name + size
        id: string,
        instock: string // TODO:update with each stock and order
        stock?: Array<{ timeStamp: Date, value: string }>,//Total stock bought with "time of addition of stock" for a single product for single store
    }>,
    rating: number | { data: Array<number>, average: number },
    totalRefunds?: number,
    status?: 'ACTIVE' | "NOTACTIVE",
    onDuty: boolean,
    storeManager: { name: string, id: string },
    employees: Array<{
        name: string, id: string,
    }>, // add when added or updated
    totalSales?: number,
    stock?: number | Array<{ timeStamp: Date, value: string }>,//Total stock bought with "time of addition of stock" for a single store
}, keywords: Array<string>) {
    return {
        name: body.name,
        code: body.name.toUpperCase(),
        products: body.products,
        location: body.location,
        rating: body.rating,
        inStock: 0,
        stock: [],
        keywords: keywords,
        status: 'ACTIVE',
        totalRefunds: 0, // calculate with order update
        totalSales: 0, //calculate with orders update for each order of store
        onDuty: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
}

export const addGory = function (body: {
    name: string,
    parent?: string
}, keywords: Array<string>) {
    let data: any = {
        name: body.name,
        keywords
    }
    if (body.parent) data['parent'] = body.parent;
    return data
}

export const addOrder = function (body: {
    customerName: string,
    contact: string,
    email: string,
    cid: string,
    location: location,
    items: Array<item>,
    totalCost: number,
    finalCost: number,
    paymentStatus: string,
    paymentType: string,
    timeAssigned: Date,
    offer?: {
        name: string,
        id: string
    },
    discount?: number,
    vid?: string,
    orderRating?: number,
    orderType?: string,
    deliveryRating?: number,
    vendorRating?: number,
    status?: string,
    comment?: string,
    timeDelivered?: Date,
    deliveryBoy?: string,
    did?: string

}, keywords: Array<string>) {
    return {
        customerName: body.customerName,
        contact: body.contact,
        email: body.email,
        cid: body.cid,
        location: body.location,
        items: body.items,
        totalCost: body.totalCost,
        finalCost: body.finalCost,
        orderRating: 0,
        deliveryRating: 0,
        status: 'PLACED',
        paymentStatus: body.paymentStatus,
        paymentType: body.paymentType,
        timeAssigned: body.timeAssigned,
        keywords,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
}

export const addOffer = function (body: {
    name: string,
    code: string,
    discount: number,
    unit: string
}) {
    const data: any = {
        name: body.name,
        code: body.code,
        discount: body.discount,
        unit: body.unit,
        createdAt: admin.firestore.FieldValue.serverTimestamp()

    }
    return data
}

export const addCart = function (body: {
    cid: string
}) {
    const data: any = {
        items: [],
        totalCost: 0,
        offer: 'NA',
        discount: 0,
        cid: body.cid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
    return data
}

export const addSaved = function (body: {
    cid: string
}) {
    const data: any = {
        items: [],
        cid: body.cid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
    return data
}
