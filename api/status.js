

// api/status.js
// Vercel serverless function. Looks up a transaction's status by id.
// Usage: /api/status?id=<transactionId>

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.PAYLOR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'PAYLOR_API_KEY is not configured' });
  }

  const { id } = req.query || {};
  if (!id) {
    return res.status(400).json({ error: 'Missing id query parameter' });
  }

  try {
    const response = await fetch(
      `https://api.paylorke.com/api/v1/merchants/payments/transactions/${id}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Paylor', detail: err.message });
  }
}
