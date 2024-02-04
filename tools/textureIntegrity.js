const { api_url } = require("../lib/getTokens")();

/**
 * Checks that all textures in the database have uses and paths
 * @author Evorp
 */

const rawFetch = (path) =>
	fetch(`${api_url}${path}/raw`)
		.then((res) => res.json())
		.then(Object.values);

async function textureIntegrity() {
	// faster to implement logic ourselves than to fetch 6000 times
	const textures = await rawFetch("textures");
	const uses = await rawFetch("uses");
	const paths = await rawFetch("paths");

	const all = textures
		.map((tex) => ({
			...tex,
			uses: uses.filter((u) => u.texture == tex.id),
		}))
		.map((tex) => ({
			...tex,
			paths: paths.filter((p) => tex.uses.map((u) => u.id).includes(p.use)),
		}));

	// both missing uses and paths are picked up
	require("fs").writeFileSync(
		"./out.json",
		JSON.stringify(
			all.filter((t) => !t.paths.length),
			null,
			4,
		),
	);
	console.log("Written file to ./out.json!");
	process.exit();
}

textureIntegrity();
