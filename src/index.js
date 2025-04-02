import dotenv from "dotenv"
import db_connect from './db/index.js'
import app from './app.js'

dotenv.config({path:"./.env"})

const PORT = process.env.PORT || 3200

db_connect().then(()=>{
    app.listen(PORT,()=>{
        console.log(`app listen in port : ${PORT}`);
    })    

    app.on("error",(error)=>{
        throw error
    })
}).catch((error)=>{
    console.log(`server connection error :: `,error);
})