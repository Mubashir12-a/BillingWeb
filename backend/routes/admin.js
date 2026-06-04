const express = require('express');
const router = express.Router();

// POST verify admin PIN
router.post('/verify', (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ success: false, message: 'PIN required' });
  if (String(pin) === String(process.env.ADMIN_PIN)) {
    res.json({ success: true, message: 'Access granted' });
  } else {
    res.status(401).json({ success: false, message: 'Incorrect PIN' });
  }
});

module.exports = router;
