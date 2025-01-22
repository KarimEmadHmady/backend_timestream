


const express = require('express');
const router = express.Router();
const CheckInOut = require('../models/CheckInOut');
const moment = require('moment'); // To format the date and compare it


// Check-in route
router.post('/checkin', async (req, res) => {
  const { userId, firstName, lastName, email, checkInTime } = req.body;

  if (!userId || !checkInTime) {
    return res.status(400).json({ error: 'User ID and check-in time are required' });
  }

  try {
    const currentTime = new Date(); // Current time

    // Create a new check-in record
    const checkInRecord = new CheckInOut({
      userId,
      firstName,
      lastName,
      email,
      checkInTime,
      status: 'checked-in',
      date: currentTime // Track the check-in by the current time
    });

    await checkInRecord.save();
    res.status(200).json({ message: 'Check-in recorded successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

// Checkout route (same as before)
router.post('/checkout', async (req, res) => {
  const { userId } = req.body;

  try {
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const checkInRecord = await CheckInOut.findOne({
      userId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: 'checked-in',
    });

    if (!checkInRecord) {
      return res.status(404).json({ error: 'No check-in record found for this user today' });
    }

    if (checkInRecord.status === 'checked-out') {
      return res.status(400).json({ error: 'User already checked out today' });
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(checkInRecord.checkInTime);

    const totalTimeInMilliseconds = checkOutTime - checkInTime;
    const totalTimeInMinutes = Math.floor(totalTimeInMilliseconds / 60000);
    const hours = Math.floor(totalTimeInMinutes / 60);
    const minutes = totalTimeInMinutes % 60;

    checkInRecord.checkOutTime = checkOutTime.toISOString();
    checkInRecord.status = 'checked-out';

    await checkInRecord.save();

    res.status(200).json({
      message: `Checkout successful. Total time: ${hours} hour(s) and ${minutes} minute(s)`,
    });

  } catch (error) {
    console.error('Error in checkout route:', error);
    res.status(500).json({ error: 'Failed to record check-out' });
  }
});



// return last 30 day and this is correct

router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log(`Fetching history for user: ${userId}`); // Add logging

  try {
    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch records from the last 30 days for the given user
    const records = await CheckInOut.find({
      userId,
      date: { $gte: thirtyDaysAgo } // Filter records with date greater than or equal to 30 days ago
    }).sort({ date: -1 }); // Sort by date, most recent first

    console.log(records); // Log fetched records

    res.status(200).json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user history' });
  }
});

router.get('/all-users', async (req, res) => {
  try {
    const users = await CheckInOut.aggregate([
      {
        $group: {
          _id: "$userId", // Group by userId
          firstName: { $first: "$firstName" }, // Get the first name from the first occurrence 
          lastName: { $first: "$lastName" },   // Get the last name from the first occurrence
        }
      }
    ]);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err });
  }
});


app.delete('/clear', async (req, res) => {
  try {
    await CheckInOut.deleteMany({});  // This deletes all data in the CheckInOut collection
    res.status(200).json({ message: 'All records deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete records', error });
  }
});



module.exports = router;


