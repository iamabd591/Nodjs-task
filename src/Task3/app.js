const express = require("express");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv").config();
const dataBaseName = "task";
const app = express();
app.use(express.json());
const client = new MongoClient(process.env.Db_Connecting_String);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db(dataBaseName);
    console.log(`Successfully connect to Mongodb Data Base\n`);
  } catch (error) {
    console.log(`Failed to connect to MongoDb ${error}\n`);
  }
}
connectDB();

app.get("/api/get_all_data", async (req, res) => {
  try {
    const data = await db.collection("nodetask").find().toArray();
    res.status(200).json(data);
    console.log(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error to get data from data base ${error}` });
    console.log(`Failed to get data from data base ${error}`);
  }
});

app.post("/api/add_data", async (req, res) => {
  try {
    const newData = req.body;
    console.log(newData);
    await db.collection("nodetask").insertMany(newData);
    res.status(201).json({ message: `Data added Successfuly` });
  } catch (error) {
    res.status(500).json({ message: `Unable to add data to db ${error}` });
    console.log(`Unable to add data to db ${error}`);
  }
});

app.delete("/api_delete/:email", async (req, res) => {
  const email = req.params.email;
  console.log(email);
  try {
    const result = await db.collection("nodetask").deleteOne({ email: email });
    console.log(result.deletedCount); 
    if (result.deletedCount >0) {
      res
        .status(200)
        .json({ message: `Record is Deleted with this email ${email}` });
    } else {
      res
        .status(404)
        .json({ message: `No Record is found with this email ${email}` });
    }
  } catch (error) {
    res.status(500).json({ message: `Unable to delete record` });
    console.log(`Unable to delete record`);
  }
});


app.put("/api/update_password/:email", async (req, res) => {
  const email = req.params.email;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  try {
    const result = await db
      .collection("nodetask")
      .updateOne({ email: email }, { $set: { password: password } });

      console.log(result.matchedCount)
    if (result.matchedCount >0) {
      res
        .status(200)
        .json({ message: `Password updated successfully for ${email}.` });
    } else {
      res.status(404).json({ message: `No record found with email ${email}.` });
    }
  } catch (error) {
    res.status(500).json({ message: `Unable to update password: ${error}` });
    console.log(`Unable to update password: ${error}`);
  }
});

module.exports = app;
