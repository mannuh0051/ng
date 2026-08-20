// api/save-application.js

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. "mannuh0051/richek"
  const FILE_PATH = process.env.GITHUB_FILE_PATH || 'data/applications.json';

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return res.status(500).json({ error: 'GitHub credentials not configured in Vercel' });
  }

  const newApplication = req.body;

  if (!newApplication || !newApplication.id) {
    return res.status(400).json({ error: 'Invalid application data' });
  }

  const githubApiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
  const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  try {
    // 1. Get the current file (if it exists)
    let currentContent = [];
    let sha = null;

    const getRes = await fetch(githubApiUrl, { method: 'GET', headers });
    
    if (getRes.ok) {
      const getFile = await getRes.json();
      sha = getFile.sha;
      // GitHub returns base64 encoded content
      const decodedStr = Buffer.from(getFile.content, 'base64').toString('utf8');
      try {
        currentContent = JSON.parse(decodedStr);
        if (!Array.isArray(currentContent)) {
          currentContent = []; // Fallback if it's not an array
        }
      } catch (e) {
        currentContent = [];
      }
    } else if (getRes.status !== 404) {
      // If it's an error other than "Not Found"
      const errData = await getRes.json();
      return res.status(500).json({ error: 'Failed to fetch from GitHub', details: errData });
    }

    // 2. Append or Update the application (Upsert)
    const existingIndex = currentContent.findIndex(app => app.id === newApplication.id);
    if (existingIndex !== -1) {
      currentContent[existingIndex] = newApplication; // Update existing
    } else {
      currentContent.push(newApplication); // Append new
    }

    // 3. Encode back to base64
    const newContentBase64 = Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64');

    // 4. Update or Create the file on GitHub
    const putBody = {
      message: `Add application ${newApplication.id}`,
      content: newContentBase64,
      branch: 'main' // Change this if your default branch is 'master'
    };
    
    if (sha) {
      putBody.sha = sha; // Required when updating an existing file
    }

    const putRes = await fetch(githubApiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errData = await putRes.json();
      return res.status(500).json({ error: 'Failed to save to GitHub', details: errData });
    }

    return res.status(200).json({ success: true, message: 'Application saved to GitHub' });

  } catch (err) {
    console.error('GitHub API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
