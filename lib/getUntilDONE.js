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
	let item;
	while (item !== stopWord) {
		item = await prompt(query);
		items.push(item);
	}
	// remove any accidentally empty items
	return items.filter((p) => p);
};
