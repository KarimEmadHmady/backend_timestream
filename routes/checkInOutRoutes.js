const express = require("express");
const router = express.Router();
const CheckInOut = require("../models/CheckInOut");
const moment = require("moment-timezone");

// ضبط المنطقة الزمنية لمصر
const timezone = "Africa/Cairo";

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
      checkInTime: new Date(checkInTime), // تخزين التوقيت كما هو
      status: "checked-in",
      date: new Date(),
    });

    await checkInRecord.save();
    res.status(200).json({ message: "Check-in recorded successfully" });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ error: "Failed to record check-in" });
  }
});

// تسجيل الخروج (Check-out)
router.post("/checkout", async (req, res) => {
  const { userId } = req.body;

  try {
    const startOfDay = moment().tz(timezone).startOf('day').toDate();
    const endOfDay = moment().tz(timezone).endOf('day').toDate();

    const checkInRecord = await CheckInOut.findOne({
      userId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: "checked-in",
    });

    if (!checkInRecord) {
      return res.status(404).json({ error: "No check-in record found for this user today" });
    }

    if (checkInRecord.status === "checked-out") {
      return res.status(400).json({ error: "User already checked out today" });
    }

    checkInRecord.checkOutTime = new Date(); // تسجيل التوقيت كما هو
    checkInRecord.status = "checked-out";

    await checkInRecord.save();

    res.status(200).json({
      message: "Checkout successful",
      checkInTime: checkInRecord.checkInTime,
      checkOutTime: checkInRecord.checkOutTime,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Failed to record check-out" });
  }
});

// استرجاع السجل لآخر 30 يومًا
router.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const thirtyDaysAgo = moment().tz(timezone).subtract(30, "days").toDate();

    let records = await CheckInOut.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    // تنسيق التوقيت بالمنطقة الزمنية قبل الإرسال
    records = records.map((record) => ({
      ...record._doc,
      checkInTime: moment(record.checkInTime).tz(timezone).format("YYYY-MM-DD hh:mm A"),
      checkOutTime: record.checkOutTime
        ? moment(record.checkOutTime).tz(timezone).format("YYYY-MM-DD hh:mm A")
        : null,
      date: moment(record.date).tz(timezone).format("YYYY-MM-DD hh:mm A"),
    }));

    res.status(200).json(records);
  } catch (error) {
    console.error("History fetch error:", error);
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
