const express = require('express');
const ContactEnquiry = require('../models/ContactEnquiry');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, phone, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ message: 'Name, phone and message are required.' });
    }

    const enquiry = await ContactEnquiry.create({ name, phone, message });
    res.status(201).json(enquiry);
  } catch (error) {
    res.status(500).json({ message: 'Unable to send message.', error: error.message });
  }
});

module.exports = router;
