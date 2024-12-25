const fs = require("fs").promises;
const { logger } = require("./logger");
const path = require("path");

const TOKEN_FILE = path.resolve(__dirname,  '../config/tokenz.json') 
const proxyPath = path.resolve(__dirname,  '../config/proxy.txt') 

// Function to save the token
async function saveToken(data) {
    try {
        let tokens = [];
        try {
            const fileData = await fs.readFile(TOKEN_FILE, 'utf8');
            tokens = JSON.parse(fileData);
        } catch (error) {
            logger("No previous tokens found.", "error");
        }

        const tokenIndex = tokens.findIndex(token => token.username === data.username);

        if (tokenIndex !== -1) {
            tokens[tokenIndex] = data;
            logger(`Token for ${data.username} updated.`);
        } else {
            tokens.push(data);
            logger(`Token for ${data.username} added.`);
        }

        await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2));
        logger('Token saved successfully!', "success");

    } catch (error) {
        logger('Error saving token:', "error", error);
    }
}


// Function to read all saved tokens
async function readToken() {
    try {
        const data = await fs.readFile(TOKEN_FILE, "utf8");
        return JSON.parse(data);
    } catch {
        logger("No tokens found. Please login first.", "error");
        process.exit(1);
    }
}

async function loadProxies() {
    try {
        const data = await fs.readFile(proxyPath, 'utf8');
        return data.split('\n').filter(proxy => proxy.trim() !== '');
    } catch (error) {
        logger('Error reading proxy file:', "error", error);
        return [];
    }
}

function generateRandomHeaders() {
  const randomVersion = () => (Math.floor(Math.random() * 50) + 100).toString();
  const randomPriority = () => Math.random().toFixed(1);

  // 随机选择平台并生成对应的 User-Agent
  const isWindows = Math.random() < 0.5; // 50% 概率选择 Windows 或 Mac
  const userAgent = isWindows
    ? `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomVersion()}.0.0.0 Safari/537.36`
    : `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomVersion()}.0.0.0 Safari/537.36`;

  return {
    "accept": "*/*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-US,en;q=0.9",
    "priority": `u=1, i; p=${randomPriority()}`, // 随机优先级
    "sec-ch-ua": `"Google Chrome";v="${randomVersion()}", "Chromium";v="${randomVersion()}", "Not_A Brand";v="${Math.floor(Math.random() * 30)}"`,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": isWindows ? '"Windows"' : '"Mac OS"', // 与 User-Agent 平台一致
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "none",
    "user-agent": userAgent,
    'content-type': 'application/json',
  };
}

module.exports = { saveToken, readToken, loadProxies, generateRandomHeaders };
