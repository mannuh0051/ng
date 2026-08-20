// api/stk-push.js
const PAYLOR_API_KEY = process.env.PAYLOR_API_KEY;
const PAYLOR_BASE = 'https://api.paylorke.com/api/v1';

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate API key
  if (!PAYLOR_API_KEY) {
    return res.status(500).json({ error: 'PAYLOR_API_KEY not configured' });
  }

  const { phone, amount, reference, channelId, description } = req.body;

  // Validate required fields
  if (!phone || !amount || !reference || !channelId) {
    return res.status(400).json({
      error: 'Missing required fields: phone, amount, reference, channelId'
    });
  }

  // Ensure phone is in international format (2547XXXXXXXX)
  const normalizedPhone = phone.replace(/\D/g, '');
  const finalPhone = normalizedPhone.startsWith('254')
    ? normalizedPhone
    : '254' + normalizedPhone.replace(/^0+/, '');

  try {
    const response = await fetch(`${PAYLOR_BASE}/merchants/payments/stk-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYLOR_API_KEY}`
      },
      body: JSON.stringify({
        phoneNumber: finalPhone,
        amount: Number(amount),
        reference: reference,
        channelId: channelId,
        description: description || 'Payment'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Paylor error:', data);
      return res.status(response.status).json({
        error: data.message || data.error || 'STK push failed'
      });
    }

    // Return the transaction ID for status polling
    return res.status(200).json({
      success: true,
      transactionId: data.transactionId || data.reference || data.transaction_id,
      message: 'STK push sent successfully'
    });

  } catch (err) {
    console.error('STK push error:', err);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};
