// const express = require("express");
// const router = express.Router();
// const CheckInOut = require("../models/CheckInOut");
// const moment = require("moment-timezone");

// // ضبط المنطقة الزمنية لمصر
// const timezone = "Africa/Cairo";

// // تسجيل الدخول (Check-in)
// router.post("/checkin", async (req, res) => {
//   const { userId, firstName, lastName, email, checkInTime } = req.body;

//   if (!userId || !checkInTime) {
//     return res.status(400).json({ error: "User ID and check-in time are required" });
//   }

//   try {
//     const currentTime = moment().tz(timezone).toISOString();
    
//     const checkInRecord = new CheckInOut({
//       userId,
//       firstName,
//       lastName,
//       email,
//       checkInTime: moment(checkInTime).tz(timezone).toISOString(),
//       status: "checked-in",
//       date: currentTime,
//     });

//     await checkInRecord.save();
//     res.status(200).json({ message: "Check-in recorded successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to record check-in" });
//   }
// });

// // تسجيل الخروج (Check-out)
// router.post("/checkout", async (req, res) => {
//   const { userId } = req.body;

//   try {
//     const startOfDay = moment().tz(timezone).startOf('day').toISOString();
//     const endOfDay = moment().tz(timezone).endOf('day').toISOString();

//     const checkInRecord = await CheckInOut.findOne({
//       userId,
//       date: { $gte: startOfDay, $lt: endOfDay },
//       status: "checked-in",
//     });

//     if (!checkInRecord) {
//       return res.status(404).json({ error: "No check-in record found for this user today" });
//     }

//     if (checkInRecord.status === "checked-out") {
//       return res.status(400).json({ error: "User already checked out today" });
//     }

//     const checkOutTime = moment().tz(timezone).toISOString();
//     checkInRecord.checkOutTime = checkOutTime;
//     checkInRecord.status = "checked-out";

//     await checkInRecord.save();

//     res.status(200).json({
//       message: "Checkout successful",
//       checkInTime: checkInRecord.checkInTime,
//       checkOutTime: checkInRecord.checkOutTime, // تأكد من إرجاع وقت الخروج المسجل
//     });
//   } catch (error) {
//     console.error("Error in checkout route:", error);
//     res.status(500).json({ error: "Failed to record check-out" });
//   }
// });

// // استرجاع السجل لآخر 30 يومًا
// router.get("/history/:userId", async (req, res) => {
//   const { userId } = req.params;
//   console.log(`Fetching history for user: ${userId}`);

//   try {
//     const thirtyDaysAgo = moment().tz(timezone).subtract(30, "days").toISOString();

//     let records = await CheckInOut.find({
//       userId,
//       date: { $gte: thirtyDaysAgo },
//     }).sort({ date: -1 });

//     // تعديل التواريخ بحيث تكون بالمنطقة الزمنية الصحيحة قبل إرسالها إلى الفرونت
//     records = records.map((record) => ({
//       ...record._doc,
//       checkInTime: moment(record.checkInTime).tz(timezone).format("YYYY-MM-DD hh:mm A"),
//       checkOutTime: record.checkOutTime
//         ? moment(record.checkOutTime).tz(timezone).format("YYYY-MM-DD hh:mm A")
//         : null,
//       date: moment(record.date).tz(timezone).format("YYYY-MM-DD hh:mm A"),
//     }));

//     console.log(records);
//     res.status(200).json(records);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch user history" });
//   }
// });

// // جلب جميع المستخدمين
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

// // مسح جميع السجلات
// router.delete("/clear", async (req, res) => {
//   try {
//     await CheckInOut.deleteMany({});
//     res.status(200).json({ message: "All records deleted successfully." });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to delete records", error });
//   }
// });

// module.exports = router;








const express = require("express");
const router = express.Router();
const CheckInOut = require("../models/CheckInOut");

// تسجيل الدخول (Check-in)
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
      checkInTime: new Date(checkInTime).toISOString(),
      status: "checked-in",
      date: new Date(),
    });

    await checkInRecord.save();
    res.status(200).json({ message: "Check-in recorded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to record check-in" });
  }
});

// تسجيل الخروج (Check-out)
router.post("/checkout", async (req, res) => {
  const { userId } = req.body;

  try {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const checkInRecord = await CheckInOut.findOne({
      userId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: "checked-in",
    }).sort({ checkInTime: -1 });

    if (!checkInRecord) {
      return res.status(404).json({ error: "No check-in record found for this user today" });
    }

    if (checkInRecord.status === "checked-out") {
      return res.status(400).json({ error: "User already checked out today" });
    }

    checkInRecord.checkOutTime = new Date().toISOString(); // تخزين التوقيت بتنسيق UTC
    checkInRecord.status = "checked-out";

    await checkInRecord.save();

    res.status(200).json({
      message: "Checkout successful",
      checkInTime: checkInRecord.checkInTime,
      checkOutTime: checkInRecord.checkOutTime,
    });
  } catch (error) {
    console.error("Error in checkout route:", error);
    res.status(500).json({ error: "Failed to record check-out" });
  }
});


// استرجاع السجل لآخر 30 يومًا
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

    res.status(200).json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user history" });
  }
});

// جلب جميع المستخدمين
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

// مسح جميع السجلات
router.delete("/clear", async (req, res) => {
  try {
    await CheckInOut.deleteMany({});
    res.status(200).json({ message: "All records deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete records", error });
  }
});

module.exports = router;