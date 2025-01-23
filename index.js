

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const checkInOutRoutes = require('./routes/checkInOutRoutes');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Allows cross-origin requests
app.use(cookieParser()); // Parses cookies sent in requests

app.use((req, res, next) => {
  const allowedIP = '192.168.1.100';  // Replace with your home network's IP address
  const clientIP = req.ip || req.connection.remoteAddress;

  if (clientIP.includes(allowedIP)) {
    next(); // Allow access
  } else {
    res.status(403).send('Access Denied: You are not on the allowed network.');
  }
});

// app.use((req, res, next) => {
//   const allowedIPs = ['154.176.210.135'];  // Replace with the list of allowed IPs // , '192.168.1.101', '192.168.1.102'
//   const clientIP = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;

//   if (allowedIPs.some(ip => clientIP.includes(ip))) {
//     next(); // Allow access
//   } else {
//     res.status(403).send('Access Denied: You are not on the allowed network.');
//   }
// });


// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Use the routes
app.use('/api/checkinout', checkInOutRoutes);

// Sample Route
app.get('/', (req, res) => {
  res.send('Backend is running.....');
});

cron.schedule('0 0 */30 * *', async () => {
  try {
    await CheckInOut.deleteMany({});
    console.log('All check-in records deleted every 30 days.');
  } catch (error) {
    console.error('Error clearing check-in records:', error);
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

