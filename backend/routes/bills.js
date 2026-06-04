const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');

// GET all bills with optional filters
router.get('/', async (req, res) => {
  try {
    const { customerId, customerName, dateFrom, dateTo, status, limit = 100 } = req.query;
    const query = {};

    if (customerId) query.customerId = customerId;
    if (customerName) query.customerName = { $regex: customerName, $options: 'i' };
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.billDate = {};
      if (dateFrom) query.billDate.$gte = dateFrom;
      if (dateTo) query.billDate.$lte = dateTo;
    }

    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET bills for a specific customer
router.get('/customer/:id', async (req, res) => {
  try {
    const bills = await Bill.find({ customerId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET stats
router.get('/stats/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [totalBills, todayBills, monthBills] = await Promise.all([
      Bill.countDocuments({ status: 'sent' }),
      Bill.countDocuments({ billDate: today, status: 'sent' }),
      Bill.find({ billDate: { $gte: firstOfMonth }, status: 'sent' })
    ]);

    const monthTotal = monthBills.reduce((sum, b) => sum + b.amount, 0);

    res.json({
      success: true,
      data: {
        totalBills,
        todayBills,
        monthTotal
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create new bill record
router.post('/', async (req, res) => {
  try {
    const { customerId, customerName, customerPhone, amount, billDate, imageUrl, status } = req.body;
    if (!customerId || !customerName || !amount || !billDate) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    const bill = new Bill({ customerId, customerName, customerPhone, amount, billDate, imageUrl: imageUrl || '', status: status || 'sent' });
    const saved = await bill.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE all bills (Clear history)
router.delete('/actions/clear-all', async (req, res) => {
  try {
    await Bill.deleteMany({});
    res.json({ success: true, message: 'All bill history deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE a bill record
router.delete('/:id', async (req, res) => {
  try {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
