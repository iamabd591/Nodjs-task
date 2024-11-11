const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    console.log("Connecting to database with:", process.env.dbConnection);
    await mongoose.connect(process.env.dbConnection, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Successfully connected to the database");
  } catch (error) {
    console.log(`Unable to connect to the database: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDb;
