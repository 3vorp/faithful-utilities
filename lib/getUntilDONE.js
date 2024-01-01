const prompt = require("./prompt");

/**
 * Accumulate user input into array until DONE
 * @author Evorp
 * @param {string} query what to say
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
