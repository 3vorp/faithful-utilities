/**
 * Try requiring tokens file and output a message if it's not there
 * @author Evorp
 * @returns {string} parsed token JSON if successful, process exit if not
 */
module.exports = () => {
	/** @type {Record<string, any>} */
	let out;
	try {
		out = require("../tokens.json");
	} catch {
		console.error(
			"You need to create a ../tokens.json file!\n" +
				"I recommend renaming the ../tokens.example.json file.",
		);
		process.exit(1);
	}
	return out;
};
