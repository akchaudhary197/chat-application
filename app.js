require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;

// Connect to MongoDB (replace 'your-database-url' with your actual MongoDB URL)
const databaseUrl = process.env.MONGODB_URI || "mongodb://akchaudhary197:Ankit123@ac-f7atdfo-shard-00-00.oirkhou.mongodb.net:27017,ac-f7atdfo-shard-00-01.oirkhou.mongodb.net:27017,ac-f7atdfo-shard-00-02.oirkhou.mongodb.net:27017/Node-API?ssl=true&replicaSet=atlas-dk3454-shard-0&authSource=admin&retryWrites=true&w=majority"
mongoose.connect(databaseUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Serve static files (you can replace this with your frontend application)
app.use(express.static('public'));

// Define a MongoDB schema for messages
const messageSchema = new mongoose.Schema({
  user: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);


app.get('/delete', async (req, res) => {
    try {
      // Retrieve all messages from the database
      const result = await Message.deleteMany({});
  
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  // Send all existing messages to the connected client
  Message.find()
    .sort({ timestamp: 1 })
    .then((messages) => {
      socket.emit('allMessages', messages);
    })
    .catch((error) => {
      console.error(error);
    });

  // Listen for new messages from clients
  socket.on('sendMessage', (message) => {
    // Save the message to MongoDB
    const newMessage = new Message(message);
    newMessage.save();

    // Broadcast the new message to all connected clients
    io.emit('message', newMessage);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
