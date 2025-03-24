const mongoose = require("mongoose");

const checkInOutSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  firstName: String,
  lastName: String,
  email: String,
  checkInTime: { type: String, required: true }, 
  checkOutTime: { type: String }, 
  status: { type: String, required: true, enum: ["checked-in", "checked-out"] },
  date: { type: String, default: () => new Date().toLocaleString() }, 
});

module.exports = mongoose.model("CheckInOut", checkInOutSchema);
