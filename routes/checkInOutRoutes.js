const express = require("express");
const router = express.Router();
const CheckInOut = require("../models/CheckInOut");

 // Check-in
router.post("/checkin", async (req, res) => {
  const { userId, firstName, lastName, email, checkInTime } = req.body;

  if (!userId || !checkInTime) {
    return res.status(400).json({ error: "User ID and check-in time are required" });
  }

  try {
    const checkInRecord = new CheckInOut({
      userId,
      firstName,
      lastName,
      email,
      checkInTime, 
      status: "checked-in",
      date: checkInTime, 
    });
    await checkInRecord.save();
    
    res.status(200).json({ message: "Check-in recorded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to record check-in" });
  }
});

// Check-out
router.post("/checkout", async (req, res) => {
  const { userId, checkOutTime } = req.body;

  if (!checkOutTime) {
    return res.status(400).json({ error: "يجب إرسال وقت تسجيل الخروج من الجهاز" });
  }

  try {
    console.log(`🔍 Checking out user: ${userId} | Time from client: ${checkOutTime}`);

    const checkInRecord = await CheckInOut.findOne({
      userId,
      checkOutTime: { $exists: false }, 
    }).sort({ _id: -1 }); 

    if (!checkInRecord) {
      console.log("❌ No check-in record found for this user");
      return res.status(404).json({ error: "لا يوجد تسجيل دخول لهذا المستخدم" });
    }

    checkInRecord.checkOutTime = checkOutTime; 
    checkInRecord.status = "checked-out";

    await checkInRecord.save();

    console.log("✅ Checkout successful:", { checkInTime: checkInRecord.checkInTime, checkOutTime });

    res.status(200).json({
      message: "تم تسجيل الخروج بنجاح",
      checkInTime: checkInRecord.checkInTime,
      checkOutTime,
    });

  } catch (error) {
    console.error("🔥 Error in checkout route:", error);
    res.status(500).json({ error: "فشل في تسجيل الخروج، حاول مرة أخرى" });
  }
});

router.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log(`Fetching history for user: ${userId}`);

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let records = await CheckInOut.find({
      userId,
      checkInTime: { $gte: thirtyDaysAgo.toISOString() }
    }).sort({ checkInTime: -1 });

    console.log("Fetched Records:", records); 

    res.status(200).json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user history" });
  }
});



// Fetch all users
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
    ]);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err });
  }
});

// Clear all records
router.delete("/clear", async (req, res) => {
  try {
    await CheckInOut.deleteMany({});
    res.status(200).json({ message: "All records deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete records", error });
  }
});

module.exports = router;