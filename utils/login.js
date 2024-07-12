const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // For password hashing
const mongoClient = require('mongodb').MongoClient;

const router = express.Router();

const dbname = 'chatApp';
const userCollection = 'users'; // Assuming a collection for user details

// Login endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Connect to MongoDB
        const client = await mongoClient.connect(database);
        const db = client.db(dbname);
        const users = db.collection(userCollection);

        // Check if the user exists
        const user = await users.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create and return JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });

        client.close();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
