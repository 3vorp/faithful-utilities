/**
 * Slimmed down version of the Faithful webapp texture adder, for faster texture creation
 * @author Evorp
 */

const FAITHFUL_API_TOKEN = require("../lib/getAPIToken")();
const getUntilDONE = require("../lib/getUntilDONE");
const prompt = require("../lib/prompt");
const toTitleCase = require("../lib/toTitleCase");

// remove extension and rest of path
const getNameFromPath = (path) => path.split("/").at(-1).split(".")[0];

const fixTags = (tag) => {
	switch (tag) {
		case "Blocks":
			return "Block";
		case "Items":
			return "Item";
		case "Gui":
			return "GUI";
		case "Ui":
			return "UI";
		default:
			return tag;
	}
};

async function createTextures(previousTextures = []) {
	const versions = await fetch("https://api.faithfulpack.net/v2/settings/versions").then((res) =>
		res.json(),
	);

	const paths = await getUntilDONE('Give a texture path (use "DONE" to complete): ');
	if (!paths.length) {
		console.log("Finished adding textures, exiting program...");
		return process.exit(0);
	}

	const out = {
		// first path is used for texture name
		name: getNameFromPath(paths[0]),
		tags: [],
		uses: [],
	};

	for (const path of paths) {
		const edition = path.startsWith("assets") ? "java" : "bedrock";

		// when creating textures, paths are stored inside uses
		const pathData = {
			name: path,
			versions: [versions[edition][0]],
			mcmeta: false,
		};

		const existingIndex = out.uses.findIndex((v) => v.edition === edition);
		if (existingIndex == -1) {
			// use with correct edition doesn't exist yet, make a new one
			out.uses.push({
				edition,
				// name use after first path in the use
				name: getNameFromPath(path),
				paths: [pathData],
			});
		} else out.uses[existingIndex].paths.push(pathData);

		const textureFolderIndex = path.split("/").findIndex((v) => v == "textures");
		out.tags = [
			// remove duplicates
			...new Set(
				[
					...out.tags,
					toTitleCase(edition),
					toTitleCase(textureFolderIndex == -1 ? null : path.split("/")[textureFolderIndex + 1]),
				]
					.map(fixTags)
					.filter((i) => i), // remove null entries if texture folder not found
			),
		];
	}

	// add back previous textures from chain
	const textures = [...previousTextures, out];
	console.log(JSON.stringify(textures, null, 4));

	// only write when the user is ready to, otherwise accumulate textures
	const confirm = await prompt(
		"Are you finished? Make sure this data looks correct before writing it: [Y/N] ",
	);

	if (confirm.toLowerCase() !== "y") {
		console.log("Starting new texture...\n\n");
		// continue adding textures to same array if not done (recursive)
		return createTextures(textures);
	}

	return fetch("https://api.faithfulpack.net/v2/textures/multiple", {
		method: "post",
		headers: {
			bot: FAITHFUL_API_TOKEN,
			// stupid fetch api stuff, I wish I was using axios here lol
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(textures),
	}).then(async (res) => {
		const data = await res.json();
		if (!res.ok) return console.error(`An error occurred: ${JSON.stringify(data)}`);

		console.log(data);
		// start again from scratch now that chaining that particular one has stopped
		return createTextures();
	});
}

createTextures();
