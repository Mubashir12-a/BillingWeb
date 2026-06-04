const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// GET all customers (sorted A-Z)
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add new customer (admin)
router.post('/', async (req, res) => {
  try {
    const { name, phone, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }
    const customer = new Customer({ name: name.trim(), phone: String(phone).trim(), notes: notes || '' });
    const saved = await customer.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update customer (admin)
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, notes, active } = req.body;
    const updated = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, notes, active },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE customer (soft delete - set active: false)
router.delete('/:id', async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
