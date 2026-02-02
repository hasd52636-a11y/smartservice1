// 移动端调试API
module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: {
        userAgent: userAgent,
        accept: req.headers.accept,
        acceptLanguage: req.headers['accept-language'],
        acceptEncoding: req.headers['accept-encoding'],
        connection: req.headers.connection,
        host: req.headers.host,
        referer: req.headers.referer,
        origin: req.headers.origin
      },
      deviceInfo: {
        isMobile: isMobile,
        isDesktop: !isMobile,
        userAgentString: userAgent
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        hasZhipuKey: !!process.env.ZHIPU_API_KEY,
        zhipuKeyLength: process.env.ZHIPU_API_KEY ? process.env.ZHIPU_API_KEY.length : 0
      },
      request: {
        body: req.body,
        query: req.query,
        cookies: req.cookies
      }
    };

    res.status(200).json({
      success: true,
      message: 'Mobile debug info collected',
      data: debugInfo
    });
  } catch (error) {
    console.error('Mobile debug error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Mobile debug failed',
      message: error.message,
      stack: error.stack
    });
  }
};