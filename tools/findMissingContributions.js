const { writeFileSync } = require("fs");
const { api_url } = require("../lib/getTokens")();

const PACK = "faithful_32x";

const jsonFetch = (url) => fetch(url).then((res) => res.json());

/**
 * Find missing contributions for a provided Faithful pack.
 * @author Evorp
 */
async function findMissingContributions() {
	const [ignoreList, contributions, textures, uses, paths] = await Promise.all([
		jsonFetch(
			"https://raw.githubusercontent.com/Faithful-Resource-Pack/CompliBot/main/json/ignored_textures.json",
		),
		jsonFetch(`${api_url}contributions/search?packs=${PACK}`).then((res) =>
			res.map((c) => c.texture),
		),
		jsonFetch(`${api_url}textures/raw`).then(Object.values),
		jsonFetch(`${api_url}uses/raw`),
		jsonFetch(`${api_url}paths/raw`).then(Object.values),
	]);

	const ignoredPaths = Object.values(
		Object.groupBy(
			paths.map((p) => {
				p.edition = uses[p.use].edition;
				// quick hack to remove use letter
				p.texture = parseInt(p.use);
				return p;
			}),
			({ texture }) => texture,
		),
	)
		.filter((texturePaths) =>
			// any ignore pattern for any path in the texture == ignored
			texturePaths.some((path) =>
				ignoreList[path.edition].some((pattern) => path.name.includes(pattern)),
			),
		)
		.reduce((acc, paths) => {
			// texture has no paths, safe for inclusion
			if (!paths.length) return acc;
			// texture is ignored, don't include in total
			acc[paths[0].texture] = true;
			return acc;
		}, {});

	const missingTextures = textures.filter(
		// no ignored paths
		({ id }) => !ignoredPaths[id] && !contributions.includes(id),
	);

	writeFileSync(
		"out.txt",
		missingTextures.map((texture) => `[#${texture.id}] ${texture.name}`).join("\n"),
	);

	console.log("Written file to ./out.txt!");
	process.exit();
}

findMissingContributions();
