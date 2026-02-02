// 测试环境变量API
module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const zhipuApiKey = process.env.ZHIPU_API_KEY;
    const apiKey = process.env.API_KEY;
    
    const result = {
      hasZhipuApiKey: !!zhipuApiKey,
      hasApiKey: !!apiKey,
      zhipuKeyLength: zhipuApiKey ? zhipuApiKey.length : 0,
      apiKeyLength: apiKey ? apiKey.length : 0,
      zhipuKeyPrefix: zhipuApiKey ? zhipuApiKey.substring(0, 8) + '...' : 'not found',
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'not found',
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Environment test error:', error);
    res.status(500).json({ 
      error: 'Environment test failed',
      message: error.message 
    });
  }
};