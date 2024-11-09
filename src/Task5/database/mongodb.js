const mongoose = require("mongoose");
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.dbConnection);
    console.log(`Successfully connect to db`);
  } catch (error) {
    console.log(`Unable to connect db ${error.message}`);
    process.exit(1);
  }
};
module.exports = connectDb;
