const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv'); // Load dotenv package

dotenv.config(); // Load environment variables from .env file

const dbname = 'chatApp';
const chatCollection = 'chats';
const userCollection = 'onlineUsers';
const port = 5000;
const database = 'mongodb://localhost:27017/';
const app = express();

// Middleware for JSON body parsing
app.use(express.json());

// Serve static files from 'front' directory
app.use(express.static(path.join(__dirname, 'front')));
 
// Define a route handler for the root path "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'front', 'login.html')); // Serve login.html as the entry point
});

// Example in-memory database for demonstration
let users = []; // Define and initialize the users array

// Example login handler
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Find user in the in-memory database (or your actual database)
    const user = users.find(user => user.username === username && user.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ username }, process.env.JWT_SECRET); // Use process.env.JWT_SECRET

    // Send token to client
    res.json({ token });
});

// Example register handler
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Example: Check if username already exists
    if (users.some(user => user.username === username)) {
        return res.status(400).json({ message: 'Username already taken' });
    }

    // Store user in memory (or your actual database)
    const newUser = { username, password };
    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign({ username }, process.env.JWT_SECRET); // Use process.env.JWT_SECRET

    // Send token to client
    res.json({ token });
});

// Socket.io setup
const server = http.createServer(app);
const io = socketio(server);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Socket.io middleware for JWT verification
io.use((socket, next) => {
    const token = socket.handshake.auth?.token; // Optional chaining to handle undefined
    if (!token) {
        return next(new Error('Authentication error: Token missing or invalid'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Socket authentication error:', err.message);
            return next(new Error('Authentication error: Token invalid'));
        }
        socket.decoded = decoded;
        next();
    });
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('A user connected');

    // Accessing decoded user information if available
    if (socket.decoded) {
        console.log('User:', socket.decoded);
    } else {
        console.log('User authentication information not available');
    }

    // Handle socket events and logic here
});

// Error handling middleware for Socket.io
io.use((error, socket, next) => {
    console.error('Socket.io error:', error.message);
    // Handle error and possibly disconnect socket
    socket.disconnect(true); // Disconnect socket due to authentication error
});

server.listen(port, () => {
    console.log(`Chat Server listening to port ${port}...`);
});
