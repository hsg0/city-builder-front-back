// Universal MongoDB connection
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined in the environment variables");
    process.exit(1);
}

const universalMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);

        // set maxlisterners to 30
       // mongoose.connection.setMaxListeners(30);

        // set connection timeout to 10 seconds
        //mongoose.connection.setTimeout(10000);

        // set connection error handler
        mongoose.connection.on('error', (error) => {
            console.error("---------- MongoDB connection error ----------", error);
        });
        console.log("---------- MongoDB connected ----------");
    } catch (error) {
        console.error("---------- MongoDB connection error ----------", error);
        process.exit(1);
    }   
}

export default universalMongoDB;