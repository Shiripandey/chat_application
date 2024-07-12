const express = require('express');
const bcrypt = require('bcryptjs'); // For password hashing
const mongoClient = require('mongodb').MongoClient;

const router = express.Router();

const dbname = 'chatApp';
const userCollection = 'users'; // Assuming a collection for user details

// Registration endpoint
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Connect to MongoDB
        const client = await mongoClient.connect(database);
        const db = client.db(dbname);
        const users = db.collection(userCollection);

        // Check if user already exists
        const existingUser = await users.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const newUser = { username, password: hashedPassword };
        await users.insertOne(newUser);

        res.status(201).json({ message: 'User registered successfully' });

        client.close();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
