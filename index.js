const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const ObjectId = require("mongodb").ObjectId;
var admin = require("firebase-admin");

//firebase admin initialization
var serviceAccount = require("./next-watch-firebase-adminsdk-zfcjr-bdc89c7c05.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middlewaire
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vljcn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function verifyToken(req, res, next) {
  if (req.headers?.authorization) {
    const idToken = req.headers.authorization.split(" ")[1];
    try {
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      req.decodedUserEmail = decodedUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("nextWatch");
    const addProductCollection = database.collection("addproduct");
    const orderCollection = database.collection("myorder");
    const adduserCollection = database.collection("user");
    const subscriberCollection = database.collection("subscriber");

    //get api
    app.get("/addproduct", async (req, res) => {
      const cursor = addProductCollection.find({});
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
    });

    //get api
    app.get("/myorder", async (req, res) => {
      const cursor = orderCollection.find({});
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    });

    app.get("/subscriber", async (req, res) => {
      const cursor = subscriberCollection.find({});
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      const cursor = adduserCollection.find({});
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    });

    // get single api
    app.get("/addproduct/:id", async (req, res) => {
      const id = req.params.id;
      const queary = { _id: ObjectId(id) };
      const result = await addProductCollection.findOne(queary);
      res.json(result);
    });

    // get tract id api
    app.get("/myorders/:searchItem", async (req, res) => {
      const searchItem = req.params.searchItem;
      const queary = { _id: ObjectId(searchItem) };
      const result = await orderCollection.findOne(queary);
      res.json(result);
    });

    /////get admin
    app.get("/findadmin/:email", async (req, res) => {
      const email = req.params.email;
      const queary = { email: email };
      const result = await adduserCollection.find(queary).toArray();
      res.json(result);
    });

    /////get myorder single user
    app.get("/myorder/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (req.decodedUserEmail === email) {
        const queary = { email: email };
        const result = await orderCollection.find(queary).toArray();
        res.json(result);
      } else {
        res.status(401).json({ message: "User not authorized" });
      }
    });

    // post api
    app.post("/addproduct", async (req, res) => {
      const product = req.body;
      const result = await addProductCollection.insertOne(product);
      res.json(result);
      console.log(result);

      console.log("hit the post api");
      res.send("post hitted");
    });

    app.post("/myorder", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.json(result);
      console.log(result);

      console.log("hit the post api");
      res.send("post hitted");
    });

    // post api for subscriber
    app.post("/subscriber", async (req, res) => {
      const subscriber = req.body;
      console.log("this is body" + subscriber);
      const result = await subscriberCollection.insertOne(subscriber);
      res.json(result);
      console.log(result);

      console.log("hit the post api");
      res.send("post hitted");
    });

    // update api
    app.put("/adduser", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updatedoc = { $set: user };
      const result = await adduserCollection.updateOne(
        filter,
        updatedoc,
        options
      );
      res.json(result);
      console.log(result);
    });

    app.put("/dashboard/makeadmin", async (req, res) => {
      const user = req.body;
      console.log(user);
      const filter = { email: user.email };
      const updatedoc = { $set: { role: "admin" } };
      const result = await adduserCollection.updateOne(filter, updatedoc);
      res.json(result);
      console.log(result);
    });

    app.put("/updateStatus/:id", async (req, res) => {
      const user = req.body;
      const id = req.params.id;
      console.log(user);
      const filter = { _id: ObjectId(id) };
      const updatedoc = { $set: { orderStatus: user.updateStatus } };
      const result = await orderCollection.updateOne(filter, updatedoc);
      res.json(result);
      console.log(result);
    });

    // delete item
    app.delete("/dashboard/manageproduct/:id", async (req, res) => {
      const id = req.params.id;
      const queary = { _id: ObjectId(id) };
      const result = await addProductCollection.deleteOne(queary);
      res.json(result);
    });

    // delete item
    app.delete("/dashboard/myorder/:id", async (req, res) => {
      const id = req.params.id;
      const queary = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(queary);
      res.json(result);
    });

    // delete item
    app.delete("/dashboard/manageuser/:id", async (req, res) => {
      const id = req.params.id;
      const queary = { _id: ObjectId(id) };
      const result = await adduserCollection.deleteOne(queary);
      res.json(result);
    });

    // delete sub item
    app.delete("/dashboard/subscriber/:id", async (req, res) => {
      const id = req.params.id;
      const queary = { _id: ObjectId(id) };
      const result = await subscriberCollection.deleteOne(queary);
      res.json(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("NEXT WATCH DB");
});

app.listen(port, () => {
  console.log("Test next watch port", port);
});
