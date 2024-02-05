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

	// quick version of /v2/textures/<id>/all for every texture
	const all = textures.map((tex) => ({
		...tex,
		uses: uses.filter((u) => u.texture == tex.id),
		// not reliant on uses and can catch "stranded" paths
		paths: paths.filter((p) => p.use.startsWith(tex.id)),
	}));

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
