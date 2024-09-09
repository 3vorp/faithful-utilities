const { writeFileSync } = require("fs");
const { api_url } = require("../lib/getTokens")();
const minecraftSorter = require("../lib/minecraftSorter");

/**
 * Find paths that don't have assets/minecraft at the start when they probably should.
 * @author Evorp
 */
async function assetPathFinder() {
	const paths = await fetch(`${api_url}paths/raw`).then((res) => res.json());

	const results = Object.values(paths).reduce((acc, path) => {
		if (path.name.startsWith("assets")) return acc;
		const versions = path.versions.sort(minecraftSorter);
		if (
			versions.includes("bedrock-latest") ||
			versions.includes("1.4.6") ||
			versions.includes("b1.7.3")
		)
			return acc;

		console.log(path);
		const shownVersions =
			versions.length == 1 ? versions[0] : `${versions[0]} - ${versions[versions.length - 1]}`;
		acc.push(`[#${path.use.match(/\d+/)?.[0]}] - ${path.name} [${shownVersions}]`);
		return acc;
	}, []);

	writeFileSync("out.txt", results.join("\n"));
	console.log("Written file to ./out.txt!");
	process.exit();
}

assetPathFinder();
