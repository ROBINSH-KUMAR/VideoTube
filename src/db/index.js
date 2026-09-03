import mongoose from "mongoose";
import { DB_Name } from "../constants.js";


const connectDB =async()=>{
  try{
  const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
  console.log(`\n MongoDb connected !! DB HOST: ${connectionInstance}`)

  }catch(err){
    console.log("Mongodb connection failed ", err);
    process.exit(1)
    throw(err)
  }
}

export default connectDB;