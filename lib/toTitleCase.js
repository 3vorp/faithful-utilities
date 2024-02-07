/**
 * Convert a snake_case string to title case
 * @author Evorp
 * @param {string} str lowercase string
 * @returns {string} title case string
 */
module.exports = (str) =>
	str
		.split(/_| /g)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
