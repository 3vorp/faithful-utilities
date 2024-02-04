const { api_url } = require("../lib/getTokens")();

const PACK = "classic_faithful_32x";

/**
 * Find missing contributions for a provided Faithful pack.
 * @author Evorp
 */
async function findMissingContributions() {
	const allTextures = await fetch(`${api_url}textures/raw`).then((res) => res.json());
	const allContributions = await fetch(`${api_url}contributions/search?packs=${PACK}`).then((res) =>
		res.json(),
	);

	const textures = Object.values(allTextures).sort((a, b) => a.id - b.id);
	const idsWithContributions = allContributions.map((i) => i.texture);

	require("fs").writeFileSync(
		"out.txt",
		textures
			.filter((texture) => !idsWithContributions.includes(texture.id))
			.map((texture) => `[#${texture.id}] ${texture.name}`)
			.join("\n"),
	);
	console.log("Written file to ./out.txt!");
	process.exit();
}

findMissingContributions();
