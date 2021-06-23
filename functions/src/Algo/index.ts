export default class Algo {

    generateKeywords = function (data: string) {
        const keywords: Array<string> = [];
        let curName = '';
        data.toLowerCase().split('').forEach(alpha => {
            curName += alpha;
            keywords.push(curName);
        });
        return keywords
    };
    // calculateTotal = (key:'orders' | 'users' | 'products' | 'sales' | 'stores' | 'stock', store?:string) => {
    //     //Total of everything of anything
    // }
    // updateSales = (
    //     id: string,// id of document
    //     key: 'ORDER' |',
    //     transaction: 'CREDIT' | 'DEBIT',
    // ) => {
    //     //if key === 'STOCK' increase stock and  add stock transaction with timestamp in array of stock
    //       // - product - store - store product
    //     // if key === 'ORDER' deduct stock in
    //     //   - product - store - product in store
    // }
    // updateStock = (
    //     id: string,// id of document
    //     key: 'ORDER' | 'STOCK',
    //     transaction: 'CREDIT' | 'DEBIT',
    // ) => {
    //     //if key === 'STOCK' increase stock and  add stock transaction with timestamp in array of stock
    //       // - product - store - store product
    //     // if key === 'ORDER' deduct stock in
    //     //   - product - store - product in store
    // }

    // updateWallet = (value: string, type: 'CREDIT' | 'DEBIT',user:any) => {
    //
    // }
    //
    // sendNotification = (Message: string, data: any, user: any) => {
    //
    // }
    //
    // sendEmail = (Message: string, data: any, user: any) => {
    //
    // }
    //
    // sendMessage = (Message: string, data: any, user: any) => {
    //
    // }
}
