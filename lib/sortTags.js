/**
 * Sort texture tags as according to Pomi108's specification
 * @author Evorp
 * @param {string[]} input unsorted tag array
 * @returns {string[]} sorted tags
 */
module.exports = (input) => {
	// remove duplicates/null items and alphabetically sort
	let arr = [...new Set(input.filter((i) => i))].sort();
	// shift java, realms, and bedrock tags to start
	if (arr.includes("Realms")) arr = ["Realms", ...arr.filter((i) => i !== "Realms")];
	if (arr.includes("Modded")) arr = ["Modded", ...arr.filter((i) => i !== "Modded")];
	if (arr.includes("Bedrock")) arr = ["Bedrock", ...arr.filter((i) => i !== "Bedrock")];
	if (arr.includes("Java")) arr = ["Java", ...arr.filter((i) => i !== "Java")];
	return arr;
};
