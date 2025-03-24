// const express = require("express");
// const router = express.Router();
// const CheckInOut = require("../models/CheckInOut");

// // Check-in
// router.post("/checkin", async (req, res) => {
//   const { userId, firstName, lastName, email, checkInTime } = req.body;

//   if (!userId || !checkInTime) {
//     return res.status(400).json({ error: "User ID and check-in time are required" });
//   }

//   try {
//     const checkInRecord = new CheckInOut({
//       userId,
//       firstName,
//       lastName,
//       email,
//       checkInTime: new Date(checkInTime), // Store as Date object
//       status: "checked-in",
//       date: new Date(),
//     });

//     await checkInRecord.save();
//     res.status(200).json({ message: "Check-in recorded successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to record check-in" });
//   }
// });

// // Check-out
// router.post("/checkout", async (req, res) => {
//   const { userId } = req.body;

//   try {
//     const now = new Date();
//     const startOfDay = new Date(now.setUTCHours(0, 0, 0, 0));
//     const endOfDay = new Date(now.setUTCHours(23, 59, 59, 999));

//     const checkInRecord = await CheckInOut.findOne({
//       userId,
//       date: { $gte: startOfDay, $lt: endOfDay },
//       status: "checked-in",
//     }).sort({ checkInTime: -1 });

//     if (!checkInRecord) {
//       return res.status(404).json({ error: "No check-in record found for this user today" });
//     }

//     if (checkInRecord.status === "checked-out") {
//       return res.status(400).json({ error: "User already checked out today" });
//     }

//     checkInRecord.checkOutTime = new Date(); // Store as Date object
//     checkInRecord.status = "checked-out";

//     await checkInRecord.save();

//     res.status(200).json({
//       message: "Checkout successful",
//       checkInTime: new Date(checkInRecord.checkInTime).toLocaleString("en-US", { timeZone: "Africa/Cairo" }),
//       checkOutTime: new Date(checkInRecord.checkOutTime).toLocaleString("en-US", { timeZone: "Africa/Cairo" }),
//     });
//   } catch (error) {
//     console.error("Error in checkout route:", error);
//     res.status(500).json({ error: "Failed to record check-out" });
//   }
// });

// // Fetch history for the last 30 days
// router.get("/history/:userId", async (req, res) => {
//   const { userId } = req.params;
//   console.log(`Fetching history for user: ${userId}`);

//   try {
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//     let records = await CheckInOut.find({
//       userId,
//       date: { $gte: thirtyDaysAgo },
//     }).sort({ date: -1 });

//     // Convert times to Cairo timezone for response
//     records = records.map(record => ({
//       ...record._doc,
//       checkInTime: new Date(record.checkInTime).toLocaleString("en-US", { timeZone: "Africa/Cairo" }),
//       checkOutTime: record.checkOutTime
//         ? new Date(record.checkOutTime).toLocaleString("en-US", { timeZone: "Africa/Cairo" })
//         : null,
//     }));

//     res.status(200).json(records);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch user history" });
//   }
// });

// // Fetch all users
// router.get("/all-users", async (req, res) => {
//   try {
//     const users = await CheckInOut.aggregate([
//       {
//         $group: {
//           _id: "$userId",
//           firstName: { $first: "$firstName" },
//           lastName: { $first: "$lastName" },
//         },
//       },
//     ]);

//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching users", error: err });
//   }
// });

// // Clear all records
// router.delete("/clear", async (req, res) => {
//   try {
//     await CheckInOut.deleteMany({});
//     res.status(200).json({ message: "All records deleted successfully." });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to delete records", error });
//   }
// });

// module.exports = router;

const express = require("express")
const router = express.Router()
const CheckInOut = require("../models/CheckInOut")

// Check-in
router.post("/checkin", async (req, res) => {
  const { userId, firstName, lastName, email, checkInTime } = req.body

  if (!userId || !checkInTime) {
    return res.status(400).json({ error: "User ID and check-in time are required" })
  }

  try {
    const checkInRecord = new CheckInOut({
      userId,
      firstName,
      lastName,
      email,
      checkInTime: new Date(checkInTime), // Store as Date object in UTC
      status: "checked-in",
      date: new Date(),
    })

    await checkInRecord.save()
    res.status(200).json({ message: "Check-in recorded successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to record check-in" })
  }
})

// Check-out
router.post("/checkout", async (req, res) => {
  const { userId } = req.body

  try {
    // Get current date in UTC
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setUTCHours(0, 0, 0, 0)

    const endOfDay = new Date(now)
    endOfDay.setUTCHours(23, 59, 59, 999)

    const checkInRecord = await CheckInOut.findOne({
      userId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: "checked-in",
    }).sort({ checkInTime: -1 })

    if (!checkInRecord) {
      return res.status(404).json({ error: "No check-in record found for this user today" })
    }

    if (checkInRecord.status === "checked-out") {
      return res.status(400).json({ error: "User already checked out today" })
    }

    checkInRecord.checkOutTime = new Date() // Store current UTC time
    checkInRecord.status = "checked-out"

    await checkInRecord.save()

    // Format times for response
    const checkInTimeFormatted = new Date(checkInRecord.checkInTime).toLocaleString("en-US", {
      timeZone: "Africa/Cairo",
    })

    const checkOutTimeFormatted = new Date(checkInRecord.checkOutTime).toLocaleString("en-US", {
      timeZone: "Africa/Cairo",
    })

    res.status(200).json({
      message: "Checkout successful",
      checkInTime: checkInTimeFormatted,
      checkOutTime: checkOutTimeFormatted,
    })
  } catch (error) {
    console.error("Error in checkout route:", error)
    res.status(500).json({ error: "Failed to record check-out" })
  }
})

// Fetch history for the last 30 days
router.get("/history/:userId", async (req, res) => {
  const { userId } = req.params
  console.log(`Fetching history for user: ${userId}`)

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let records = await CheckInOut.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 })

    // Convert times to Cairo timezone for response
    records = records.map((record) => ({
      ...record._doc,
      checkInTime: record.checkInTime
        ? new Date(record.checkInTime).toLocaleString("en-US", { timeZone: "Africa/Cairo" })
        : null,
      checkOutTime: record.checkOutTime
        ? new Date(record.checkOutTime).toLocaleString("en-US", { timeZone: "Africa/Cairo" })
        : null,
    }))

    res.status(200).json(records)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch user history" })
  }
})

// Other routes remain the same...
router.get("/all-users", async (req, res) => {
  try {
    const users = await CheckInOut.aggregate([
      {
        $group: {
          _id: "$userId",
          firstName: { $first: "$firstName" },
          lastName: { $first: "$lastName" },
        },
      },
    ])

    res.json(users)
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err })
  }
})

router.delete("/clear", async (req, res) => {
  try {
    await CheckInOut.deleteMany({})
    res.status(200).json({ message: "All records deleted successfully." })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete records", error })
  }
})

module.exports = router

