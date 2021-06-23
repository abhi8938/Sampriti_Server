import * as jwt from "jsonwebtoken";
import * as functions from 'firebase-functions';


export const auth = function (req: functions.https.Request, res: functions.Response) {
    const token = req.header('auth-token');
    if (!token) return 'Access denied. No Token';
    try {
        const secretKey = functions.config().authkey ? functions.config().authkey.key : 'abhishek8938';
        const decoded = jwt.verify(token, secretKey);
        console.log('auth',decoded);
        return undefined
    } catch (ex) {
        return 'Invalid token';
    }
};
