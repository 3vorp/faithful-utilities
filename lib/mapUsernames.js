const { api_url } = require("./getTokens")();

/**
 * Create a map of usernames to IDs or IDs to usernames
 * @author Evorp
 * @param {boolean} usernameToID which direction to go in
 * @returns {Promise<Record<string, string>>} mapped object
 */
module.exports = (usernameToID) =>
	fetch(`${api_url}contributions/authors`)
		.then((res) => res.json())
		.then((d) =>
			d.reduce((acc, cur) => {
				if (usernameToID) return { ...acc, [cur.username?.toLowerCase() ?? cur.id]: cur.id };
				return { ...acc, [cur.id]: cur.username };
			}, {}),
		);
