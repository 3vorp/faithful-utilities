const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });
/**
 * Very quick promise-based prompt system without dependencies
 * @author Evorp
 * @param {string} [query] something to ask before getting the response
 * @returns {Promise<string>} user response
 */
module.exports = (query) => new Promise((resolve) => rl.question(query, resolve));
