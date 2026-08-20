

// api/stk-push.js
// Vercel serverless function. Proxies the STK Push request to Paylor
// so the API key never reaches the browser.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.PAYLOR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'PAYLOR_API_KEY is not configured' });
  }

  const { phone, amount, reference, channelId, description } = req.body || {};
  if (!phone || !amount || !reference) {
    return res.status(400).json({ error: 'phone, amount, and reference are required' });
  }

  try {
    const response = await fetch('https://api.paylorke.com/api/v1/merchants/payments/stk-push', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        amount,
        reference,
        channelId,
        description: description || 'Checkout payment',
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Paylor', detail: err.message });
  }
}
