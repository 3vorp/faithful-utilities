/**
 * Find missing contributions for a provided Faithful pack.
 * @author Evorp
 */

const PACK = "classic_faithful_32x";

async function findMissingContributions() {
	const allTextures = await fetch("https://api.faithfulpack.net/v2/textures/raw").then((res) =>
		res.json(),
	);
	const allContributions = await fetch("https://api.faithfulpack.net/v2/contributions/raw").then(
		(res) => res.json(),
	);

	const textures = Object.values(allTextures).sort((a, b) => a.id - b.id);
	const idsWithContributions = Object.values(allContributions)
		.filter((contribution) => contribution.pack == PACK)
		.map((i) => i.texture);

	const out = textures
		.filter((texture) => idsWithContributions.includes(texture.id))
		.map((texture) => `[#${texture.id}] ${texture.name}`)
		.join("\n");

	require("fs").writeFileSync("out.txt", Buffer.from(out));
	console.log("Written file to ./out.txt!");
	process.exit();
}

findMissingContributions();
