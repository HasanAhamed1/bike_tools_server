const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ohg5x.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try{
        await client.connect();
        const toolsCollection = client.db('bikes-tools').collection('tools');
        const itemsCollection = client.db('bikes-tools').collection('items');
        app.get('/tools', async(req, res) => {
            const query = {};
            const cursor = toolsCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })

        app.get('/tools/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const tool = await toolsCollection.findOne(query);
            res.send(tool);
        })

        app.get('/items', async(req, res) => {
            const query = {};
            const cursor = itemsCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        })

}
    finally{

    }
}

run().catch(console.dir)
app.get('/', (req, res) => {
    res.send('Hello From Bikes Spot')
  })
  
  app.listen(port, () => {
    console.log(`Bikes Spot app listening on port ${port}`)
  })