const express = require("express");
const router = express.Router();
const CheckInOut = require("../models/CheckInOut");

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
//       checkInTime, // بيتم إرساله كنص من الـ Frontend
//       status: "checked-in",
//       date: checkInTime, // هيتم حفظه بنفس التوقيت بدون تعديل
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
//     const startOfDay = new Date(now.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(now.setHours(23, 59, 59, 999));

//     console.log(`🔍 Checking out user: ${userId} | Date: ${now.toISOString()}`);

//     // البحث عن أحدث عملية تسجيل دخول لليوم الحالي
//     const checkInRecord = await CheckInOut.findOne({
//       userId,
//       checkInTime: { $gte: startOfDay.toISOString(), $lt: endOfDay.toISOString() },
//       status: "checked-in",
//     }).sort({ checkInTime: -1 });

//     if (!checkInRecord) {
//       console.log("❌ No check-in record found for this user today");
//       return res.status(404).json({ error: "لا يوجد تسجيل دخول لهذا المستخدم اليوم" });
//     }

//     if (checkInRecord.status === "checked-out") {
//       console.log("⚠️ User already checked out today");
//       return res.status(400).json({ error: "تم تسجيل الخروج لهذا المستخدم بالفعل اليوم" });
//     }

//     // تسجيل وقت الخروج وتحويله إلى String
//     const checkOutTime = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });

//     checkInRecord.checkOutTime = checkOutTime;
//     checkInRecord.status = "checked-out";

//     await checkInRecord.save();

//     console.log("✅ Checkout successful:", { checkInTime: checkInRecord.checkInTime, checkOutTime });

//     res.status(200).json({
//       message: "تم تسجيل الخروج بنجاح",
//       checkInTime: checkInRecord.checkInTime,
//       checkOutTime,
//     });

//   } catch (error) {
//     console.error("🔥 Error in checkout route:", error);
//     res.status(500).json({ error: "فشل في تسجيل الخروج، حاول مرة أخرى" });
//   }
// });


// ✅ Check-in
router.post("/checkin", async (req, res) => {
  const { userId, firstName, lastName, email, checkInTime } = req.body;

  if (!userId || !checkInTime) {
    return res.status(400).json({ error: "User ID and check-in time are required" });
  }

  try {
    const checkInDate = new Date(checkInTime); // نحوله لـ Date حقيقي

    const checkInRecord = new CheckInOut({
      userId,
      firstName,
      lastName,
      email,
      checkInTime: checkInDate, // نخزنه كـ Date
      status: "checked-in",
      date: new Date(checkInDate.setHours(0, 0, 0, 0)), // نخزن التاريخ فقط بدون توقيت
    });

    await checkInRecord.save();
    res.status(200).json({ message: "Check-in recorded successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to record check-in" });
  }
});

// ✅ Check-out
router.post("/checkout", async (req, res) => {
  const { userId } = req.body;

  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    console.log(`🔍 Checking out user: ${userId} | Date: ${now.toISOString()}`);

    // البحث عن أحدث تسجيل دخول لهذا المستخدم اليوم
    const checkInRecord = await CheckInOut.findOne({
      userId,
      date: startOfDay, // نبحث حسب نفس التاريخ اللي تم حفظه في check-in
      status: "checked-in",
    }).sort({ checkInTime: -1 });

    if (!checkInRecord) {
      console.log("❌ No check-in record found for this user today");
      return res.status(404).json({ error: "لا يوجد تسجيل دخول لهذا المستخدم اليوم" });
    }

    if (checkInRecord.status === "checked-out") {
      console.log("⚠️ User already checked out today");
      return res.status(400).json({ error: "تم تسجيل الخروج لهذا المستخدم بالفعل اليوم" });
    }

    // تسجيل وقت الخروج
    const checkOutTime = new Date();

    checkInRecord.checkOutTime = checkOutTime;
    checkInRecord.status = "checked-out";

    await checkInRecord.save();

    console.log("✅ Checkout successful:", { checkInTime: checkInRecord.checkInTime, checkOutTime });

    res.status(200).json({
      message: "تم تسجيل الخروج بنجاح",
      checkInTime: new Date(checkInRecord.checkInTime).toLocaleString("en-US", { timeZone: "Africa/Cairo" }),
      checkOutTime: checkOutTime.toLocaleString("en-US", { timeZone: "Africa/Cairo" }),
    });

  } catch (error) {
    console.error("🔥 Error in checkout route:", error);
    res.status(500).json({ error: "فشل في تسجيل الخروج، حاول مرة أخرى" });
  }
});


// Fetch history for the last 30 days
router.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log(`Fetching history for user: ${userId}`);

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let records = await CheckInOut.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    // Convert times to Cairo timezone for response
    records = records.map(record => ({
      ...record._doc,
      checkInTime: new Date(record.checkInTime).toLocaleString("en-US", { timeZone: "Africa/Cairo" }),
      checkOutTime: record.checkOutTime
        ? new Date(record.checkOutTime).toLocaleString("en-US", { timeZone: "Africa/Cairo" })
        : null,
    }));

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