import mongoose from "mongoose";
import DB_NAME from "../constants.js"

const db_connect = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URL}/${DB_NAME}`
        );
        console.log(connectionInstance.connection.host);
    } catch (error) {
        console.log("mongodb connection error ::  ", error);
    }
};

 export default db_connect;
