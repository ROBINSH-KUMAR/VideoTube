import dotenv from "dotenv";
import {app} from "./app.js"
import connectDB from "./db/index.js";



connectDB().then(() => {
 
    app.on("err", () => {
      console.log("ERROR", error);
      throw error;
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`App is running on http://localhost:${process.env.PORT}`);
    })
}).catch((err)=>{
  console.log("Mongo db connection failed !!! ", err)
})

/*
const app = express()


 (async()=>{
  try{
  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
  app.on("error",()=>{
    console.log("ERROR", error)
    throw error
  })
  app.listen(process.env.PORT,()=>{
    console.log(`App is running on http://localhost:${process.env.PORT}`)
  })

  }catch (err){
    throw err
  }


 })()


*/
