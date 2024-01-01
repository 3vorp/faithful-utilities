const prompt = require("./prompt");

/**
 * Accumulate user input into array until a stop word is reached
 * @author Evorp
 * @param {string} query what to say
 * @param {string} [stopWord] what to say to return (default DONE)
 * @returns {Promise<string[]>} finished array
 */
module.exports = async (query, stopWord = "DONE") => {
	const items = [];
	while (true) {
		const item = await prompt(query);
		if (item === stopWord) break;
		items.push(item);
	}
	// remove any accidentally empty items
	return items.filter((p) => p);
};
