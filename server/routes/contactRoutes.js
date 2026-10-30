const express = require('express');
const { contactLimiter } = require('../middleware/rateLimiter');
const ContactEnquiry = require('../models/ContactEnquiry');
const {
  isPlainObject,
  readText,
  sendRouteError
} = require('../utils/httpValidation');

const router = express.Router();

router.post('/', contactLimiter, async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      return res.status(400).json({ message: 'Enquiry details must be an object.' });
    }
    const { name, phone, message } = req.body;
    const normalizedName = readText(name, { max: 100 });
    const normalizedPhone = readText(phone, { max: 24 });
    const normalizedMessage = readText(message, { max: 3000 });
    const phoneDigits = normalizedPhone?.replace(/\D/g, '') || '';
    if (
      !normalizedName
      || !normalizedPhone
      || !normalizedMessage
      || !/^\+?[\d ()-]+$/.test(normalizedPhone)
      || phoneDigits.length < 7
      || phoneDigits.length > 15
    ) {
      return res.status(400).json({ message: 'Name, phone and message are required.' });
    }

    const enquiry = await ContactEnquiry.create({
      name: normalizedName,
      phone: normalizedPhone,
      message: normalizedMessage
    });
    res.status(201).json(enquiry);
  } catch (error) {
    sendRouteError(res, error, 'Unable to send message.');
  }
});

module.exports = router;
