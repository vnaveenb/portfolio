const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

const url = process.env.MONGO_URL || 'mongodb://root:example@localhost:27017/';
const client = new MongoClient(url);

let db;

async function connectToDb() {
  await client.connect();
  console.log('Connected successfully to server');
  db = client.db('test');
}

connectToDb();

app.get('/', async (req, res) => {
  const collection = db.collection('documents');
  const findResult = await collection.find({}).toArray();
  res.json(findResult);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});