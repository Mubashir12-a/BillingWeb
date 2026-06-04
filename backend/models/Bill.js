const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  billDate: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'sent'
  }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
