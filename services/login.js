const fetch = require("node-fetch");
const { saveToken, loadProxies, headers, generateRandomHeaders, readToken } = require("../utils/file");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { logger } = require("../utils/logger");
const fs = require('fs');
const path = require("path");

const ACCOUNT_FILE = path.resolve(__dirname,  '../config/account.json');
const email_path = path.resolve(__dirname,  '../config/email.txt') 

// Function to read all accounts from account.json
async function readUsersFromFile() {
    try {
        const fileData = await fs.promises.readFile(ACCOUNT_FILE, 'utf8');
        return JSON.parse(fileData);
    } catch (error) {
        logger('Error reading users from file', 'error', error);
        return [];
    }
}

// Function to read all accounts from account.json
async function formatEmailToAccount() {
  try {
    return (await fs.promises.readFile(email_path, 'utf8'))
      .split('\n')
      .map((item) => {
        const [email, password] = item.split(':')
        return { email, password }
      })
  } catch (error) {
    logger('Error reading users from file', 'error', error)
    return []
  }
}


// Login function with proxy and added headers
async function login(email, password, API_BASE, proxy) {
    try {
        const agent = new HttpsProxyAgent(proxy);
        const headers = generateRandomHeaders()

        const response = await fetch(`${API_BASE}/api/login`, {
            method: "POST",
            headers: {
                ...headers,
            },
            body: JSON.stringify({ email, password }),
            agent,
        });

        if (response.ok) {
            const data = await response.json();
            if (data.token) {
              //////////////////////////修改/////////////////////////////////////////////////// 
                await saveToken({ token: data.token, username: email, headers: JSON.stringify(headers) });
                logger(`Login successful for ${email}!`, 'success');
            } else {
                logger(`Login failed for ${email}! No token returned.`, 'error');
            }
        } else if (response.status === 401) {
            logger(`Invalid credentials for ${email}. Please check your email and password.`, 'error');
        } else {
            const errorText = await response.text();
            logger(`Login error for ${email}: ${errorText} ${proxy}`, 'error');
        }
    } catch (error) {
        logger(`Error logging in with  ${proxy} ${email}:`, 'error', error);
    }
}

// Function to login with all accounts and use proxies
async function loginWithAllAccounts(API_BASE) {
    const proxies = await loadProxies();
    ////////////////////////// 修改 ////////////////////////////////////////////
    const accounts = await formatEmailToAccount() 
    const tokens = await readToken()


    if (proxies.length === 0) {
        logger("No proxies available. Please check your proxy.txt file.", "error");
        return;
    }
    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const proxy = proxies[i % proxies.length];
        logger(`Attempting to login with ${account.email} using proxy ${proxy}`);
        
        if (!tokens.filter(item => item.username === account.email).length) {
          await login(account.email, account.password, API_BASE, proxy);
        }
    }
    logger('All accounts logged in successfully!');
    return;
}

module.exports = { loginWithAllAccounts };
