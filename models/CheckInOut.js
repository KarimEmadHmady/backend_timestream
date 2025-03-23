const mongoose = require("mongoose");

const checkInOutSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  firstName: String,
  lastName: String,
  email: String,
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date },
  status: { type: String, required: true, enum: ["checked-in", "checked-out"] },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CheckInOut", checkInOutSchema);