const fetch = require("node-fetch");
const {HttpsProxyAgent} = require('https-proxy-agent');

// 配置代理和证书
const proxyUrl = 'http://mfufcwuh:326fto0lmaf6@155.94.202.15:5631'; // 代理URL
const agent = new HttpsProxyAgent(proxyUrl);

// 使用代理和 TLS 1.2 强制访问 URL
const url = 'https://pipe-network-backend.pipecanary.workers.dev/api/getBaseUrl';

(async () => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      rejectUnauthorized: false,
      secureProxy: false,
      agent: agent // 使用代理
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      console.error('Failed to fetch:', response.status);
    }
  } catch (error) {
    console.error('Error occurred:', error);
  }
})();
