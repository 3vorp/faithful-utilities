const sortTags = require("../lib/sortTags");

/**
 * Find textures that don't have properly sorted tags.
 * @author Evorp
 */
async function tagFinder() {
	const res = await fetch("https://api.faithfulpack.net/v2/textures/raw");
	const textures = await res.json();
	const unsortedTags = Object.values(textures).reduce((acc, cur) => {
		if (JSON.stringify(sortTags(cur.tags)) == JSON.stringify(cur.tags)) return acc;
		return [...acc, cur];
	}, []);

	const results = unsortedTags.map(
		(texture) => `[#${texture.id}] ${texture.name} - (${texture.tags.join(", ")})`,
	);
	require("fs").writeFileSync("out.txt", results.join("\n"));
	console.log("Written file to ./out.txt!");
	process.exit();
}

tagFinder();
