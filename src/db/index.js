require('dotenv').config()
const mongoose = require("mongoose");
const { DB_NAME } = require("../constants");

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

 module.exports  = db_connect;
