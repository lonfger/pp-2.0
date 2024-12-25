const fetch = require("node-fetch");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { readToken, loadProxies } = require("../utils/file");
const { logger } = require("../utils/logger");

// Fetch points for a user
async function fetchPoints(token, username, agent, API_BASE, headers) {
    try {
        const response = await fetch(`${API_BASE}/api/points`, {
            headers: {
                ...headers,
                "authorization": `Bearer ${token}`,
            },
            agent,
        });

        if (response.ok) {
            const data = await response.json();
            logger(`Current Points for ${username}: ${data.points}`, "info");
        } else {
            logger(`Failed to fetch points for ${username}: Status ${response.status}`, "error");
        }
    } catch (error) {
        logger(`Error fetching points for ${username}: ${error.message}`, "error");
    }
}

// Function to send heartbeat
async function sendHeartbeat(API_BASE) {
    const proxies = await loadProxies();
    if (proxies.length === 0) {
        logger("No proxies available. Please check your proxy.txt file.", "error");
        return;
    }

    const tokens = await readToken();
    if (!tokens.length) {
        logger("No tokens found. Please check your token.txt file.", "error");
        return;
    }

    for (let i = 0; i < tokens.length; i++) {
        const { token, username, headers } = tokens[i];
        const proxy = proxies[i % proxies.length];
        const agent = new HttpsProxyAgent(proxy);

        try {
            //await checkForRewards(API_BASE, token)
            const geoInfo = await getGeoLocation(agent);

            const response = await fetch(`${API_BASE}/api/heartbeat`, {
                method: "POST",
                headers: {
                    ...JSON.parse(headers),
                    "authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ip: geoInfo.ip,
                    location: geoInfo.location,
                    timestamp: Date.now(),
                }),
                agent,
            });

            if (response.ok) {
                logger(`Heartbeat sent successfully for ${username} using proxy: ${proxy}`, "success");
                await fetchPoints(token, username, agent, API_BASE, JSON.parse(headers));
            } else {
                const errorText = await response.text();
                logger(`Failed to send heartbeat for ${username}: ${errorText}： ${proxy}`, "error");
                await fetchPoints(token, username, agent, API_BASE, JSON.parse(headers));
            }
        } catch (error) {
            logger(`Error sending heartbeat for ${username}: ${error.message}: ${proxy}`, "error");
        }
    }
}

// Fetch IP and Geo-location data
async function getGeoLocation(agent) {
    try {
        const primaryUrl = "https://ipwhois.app/json/";
        const response = await fetch(primaryUrl, { agent });
        if (!response.ok) throw new Error(`Geo-location request failed with status ${response.status}`);
        const data = await response.json();
        return {
            ip: data.ip,
            location: `${data.city}, ${data.region}, ${data.country}`,
        };
    } catch (error) {
      try {
        const backupUrl = "https://ipinfo.io/json"; // 备用 API
        // 如果主服务失败，尝试备用服务
        const response = await fetch(backupUrl, { agent });
        if (!response.ok) throw new Error(`Backup Geo-location request failed with status ${response.status}`);
        const data = await response.json();
  
        return {
          ip: data.ip,
          location: data.loc || `${data.city}, ${data.region}, ${data.country}`,
        };
      } catch (backupError) {
        console.error("Backup service failed:", backupError.message);
  
        // 返回默认值或抛出错误
        return {
          ip: "Unknown",
          location: "Unknown",
        };
      }
    }
}



module.exports = { sendHeartbeat };
