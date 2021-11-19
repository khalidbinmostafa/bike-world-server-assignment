const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');

const port = process.env.PORT || 5000;

const ObjectId = require('mongodb').ObjectId
app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zvkzg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        console.log('database connect');

        const database = client.db("niche-product")
        const productsCollection = database.collection("products")
        const userCartCollection = database.collection("user-cart")
        const usersCollection = database.collection('users')
        const reviewsCollection = database.collection('reviews')

        //get products
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({})
            const page = req.query.page
            const size = parseInt(req.query.size)
            let result;
            if (page) {
                result = await cursor.limit(size).toArray()
            }
            else {
                result = await cursor.toArray()
            }
            res.json(result)
        })

        // post users product information
        app.post('/users', async (req, res) => {
            console.log(req.body)
            const doc = await userCartCollection.insertOne(req.body)
            res.json(doc)
        })

        // get only signed in users and show product
        app.get('/users/:id', async (req, res) => {
            const query = { email: req.params.id }
            const cursor = await userCartCollection.find(query)
            const result = await cursor.toArray()
            console.log(result)
            res.json(result)
        })


        // delete operation by user
        app.delete('/users/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) }
            const result = await userCartCollection.deleteOne(query)
            res.json(result)
        })

        // get all the users purchasing product on cart
        app.get('/users', async (req, res) => {
            const cursor = await userCartCollection.find({})
            const result = await cursor.toArray()
            res.json(result)
        })

        // update status  by the admin
        app.put('/users/:id', async (req, res) => {
            const id = req.params.id
            const updatedUser = req.body
            console.log(updatedUser)
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true }
            const updateDoc = {
                $set: {
                    Status: Shipped
                },
            };
            const result = await userCartCollection.updateOne(filter, updateDoc, option)

            res.json(result)
        })

        // save users information
        app.post('/signed/users', async (req, res) => {
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.json(result)
        })

        // get signed in users
        app.get('/signed/users', async (req, res) => {
            const query = await usersCollection.find({})
            const result = await query.toArray()
            res.json(result)
        })

        //check users signed before or not
        app.put('/signed/users', async (req, res) => {
            console.log(req.body.email)
            const filter = { email: req.body.email }
            const options = { upsert: true };
            const updateDoc = {
                $set: req.body.email
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result)
        })

        //user update as Admin
        app.put('/users/admin/:id', async (req, res) => {
            const user = req.params.id
            const updatedUser = req.body
            const filter = { email: user }
            // const option = {upsert : true}
            const updateDoc = {
                $set: {
                    role: 'Admin'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc)

            res.json(result)
        })

        // check user is admin or not
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params?.email;
            console.log(email)
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'Admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        // add new product by admin
        app.post('/add/products', async (req, res) => {
            const products = req.body
            console.log(products)
            const cursor = await productsCollection.insertOne(products)
            res.json(cursor)
        })

        // delete product by the admin
        app.delete('/products/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) }
            const result = await productsCollection.deleteOne(query)
            res.json(result)
        })

        // user review add to the database
        app.post('/review', async (req, res) => {
            console.log(req.body)
            const query = await reviewsCollection.insertOne(req.body)
            res.json(query)
        })

        // get user review to display
        app.get('/review', async (req, res) => {
            const query = await reviewsCollection.find({})
            const result = await query.toArray()
            res.json(result)
        })

        app.get('/', (req, res) => {
            res.send('Hello Bike World!')
        })

        app.listen(port, () => {
            console.log(`listening at ${port}`)
        })
    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

