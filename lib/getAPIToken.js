/**
 * Try requiring tokens file and output a message if it's not there
 * @author Evorp
 * @returns {string} Faithful API token if successful, process exit if not
 */
module.exports = () => {
	/** @type {string} */
	let out;
	try {
		out = require("../tokens.json");
	} catch {
		console.error(
			"You need to create a ../tokens.json file with your Faithful API token!\n" +
				"I recommend renaming the ../tokens.example.json file.",
		);
		process.exit(1);
	}
	return out.faithful_api_token;
};
