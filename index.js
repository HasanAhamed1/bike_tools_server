const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const jwt = require("jsonwebtoken");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ohg5x.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: "UnAuthorized access" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      req.decoded = decoded;
      next();
    });
  }
async function run(){
    try{
        await client.connect();
        const toolsCollection = client.db('bikes-tools').collection('tools');
        const itemsCollection = client.db('bikes-tools').collection('items');
        const usersCollection = client.db('bikes-tools').collection('users');
        const bookingsCollection = client.db('bikes-tools').collection('bookings');
        const reviewCollection = client.db('bikes-tools').collection('review');
        const profileCollection = client.db('bikes-tools').collection('profile');
        const paymentCollection = client.db('bikes-tools').collection('payments');

        const verifyAdmin = async(req, res, next) =>{
          const requester = req.decoded.email;
        const requesterAccount = await usersCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
            next();
        }
        else{
          res.status(403).send({message: 'forbidden'});
      }
      }

      app.post('/create-payment-intent', verifyJWT, async(req, res) =>{
        const {price} = req.body;
        const amount = price*100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          payment_method_types:['card']
        });
        res.send({clientSecret: paymentIntent.client_secret})
      });
  
      app.get("/tools", async (req, res) => {
        const query = {};
        const cursor = toolsCollection.find(query);
        const tools = await cursor.toArray();
        res.send(tools);
      });
  
      app.get('/addtool', async(req, res) => {
          const email = req.params.email;
          const query = email;
          const cursor = itemsCollection.find(query);
          const tool = await cursor.toArray();
          res.send(tool);
      })
  
      app.get("/tools/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const tool = await toolsCollection.findOne(query);
        res.send(tool);
      });
  
      app.get("/items", async (req, res) => {
        const query = {};
        const cursor = itemsCollection.find(query);
        const items = await cursor.toArray();
        res.send(items);
      });
  
      app.get("/news", async (req, res) => {
        const query = {};
        const cursor = newsCollection.find(query);
        const news = await cursor.toArray();
        res.send(news);
      });
  
      app.get("/users", verifyJWT, async (req, res) => {
        const users = await usersCollection.find().toArray();
        res.send(users);
      });
  
      app.get('/admin/:email', async(req, res) => {
          const email = req.params.email;
          const user = await usersCollection.findOne({email: email});
          const isAdmin = user.role === 'admin';
          res.send({admin: isAdmin});
      })
  
      app.get("/bookings", verifyJWT, async (req, res) => {
        const customer = req.query.customer;
        const decodedEmail = req.decoded.email;
        if (customer === decodedEmail) {
          const query = { customer: customer };
          const bookings = await bookingsCollection.find(query).toArray();
          return res.send(bookings);
        } else {
          return res.status(403).send({ message: "forbidden access" });
        }
      });
  
      app.get('/bookings/:id', verifyJWT, async(req, res) =>{
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const booking = await bookingsCollection.findOne(query);
          res.send(booking);
      })
  
      app.get('/booking', verifyJWT, async(req, res) => {
        const email = req.params.email;
        const query = email;
        const cursor = bookingsCollection.find(query);
        const allbookings = await cursor.toArray();
        res.send(allbookings);
      })
  
      app.get('/review', async(req, res) => {
        const email = req.params.email;
        const query = email;
        const cursor = reviewCollection.find(query);
        const review = await cursor.toArray();
        res.send(review);
      })
  
      app.get('/profile', verifyJWT, async(req, res) => {
        const user = req.query.user;
        const decodedEmail = req.decoded.email;
        if (user === decodedEmail) {
          const query = {user: user};
        const profile = await profileCollection.find(query).toArray();
        return res.send(profile);
        } else {
          return res.status(403).send({ message: "forbidden access" });
        }
      })
  
      app.post("/booking", async (req, res) => {
        const booking = req.body;
        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
      });
  
      app.post('/tools', verifyJWT, verifyAdmin, async(req, res) => {
          const newProduct = req.body;
          const result = await toolsCollection.insertOne(newProduct);
          res.send(result);
      })
  
      app.post('/review', async(req, res) =>{
        const review = req.body;
        const result = await reviewCollection.insertOne(review);
        res.send(result);
      });
  
      app.post('/profile', async(req, res) =>{
        const profile = req.body;
        const result = await profileCollection.insertOne(profile);
        res.send(result);
      });
  
      app.put("/users/:email", async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };
        const result = await usersCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET);
        res.send({ result, token });
      });
  
      app.put("/users/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
        const email = req.params.email;
          const filter = { email: email };
          const updateDoc = {
            $set: { role: "admin" },
          };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.send(result);
      });
  
      app.put("/profile/:email", async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = {email: email}
        const options = { upsert: true};
        const updateDoc = {
          $set: user,
        };
        const result = await profileCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      });
  
      app.patch('/bookings/:id', verifyJWT, async(req, res) =>{
        const id = req.params.id;
        const payment = req.body;
        const filter = {_id: ObjectId(id)};
        const updatedDoc ={
          $set: {
            paid: true,
            transactionId: payment.transactionId
          }
        }
        const result = await paymentCollection.insertOne(payment);
        const updatedBooking = await bookingsCollection.updateOne(filter, updatedDoc);
        res.send(updatedBooking);
      })
  
      app.delete('/tools/:id', verifyJWT, verifyAdmin, async(req, res) => {
          const id = req.params.id;
          const filter = {_id: ObjectId(id)};
          const result = await toolsCollection.deleteOne(filter);
          res.send(result);
      });
  
      app.delete('/bookings/:id', verifyJWT, async(req, res) => {
          const id = req.params.id;
          const filter = {_id: ObjectId(id)};
          const result = await bookingsCollection.deleteOne(filter);
          res.send(result);
      });
    } 
    finally {
    }
  }

run().catch(console.dir)
app.get('/', (req, res) => {
    res.send('Hello From Bikes Spot')
  })
  
  app.listen(port, () => {
    console.log(`Bikes Spot app listening on port ${port}`)
  })