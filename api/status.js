// api/status.js
const PAYLOR_API_KEY = process.env.PAYLOR_API_KEY;
const PAYLOR_BASE = 'https://api.paylorke.com/api/v1';

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!PAYLOR_API_KEY) {
    return res.status(500).json({ error: 'PAYLOR_API_KEY not configured' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing transaction ID' });
  }

  try {
    const response = await fetch(`${PAYLOR_BASE}/merchants/payments/transactions/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYLOR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Status check error:', data);
      return res.status(response.status).json({
        error: data.message || data.error || 'Status check failed'
      });
    }

    // Paylor statuses: 'COMPLETED', 'PENDING', 'FAILED', 'CANCELLED'
    return res.status(200).json({
      status: data.status || data.state || 'PENDING',
      metadata: data.metadata || data
    });

  } catch (err) {
    console.error('Status check error:', err);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};
