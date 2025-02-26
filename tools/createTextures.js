/**
 * Slimmed down version of the Faithful web app texture adder, for faster texture creation
 * @author Evorp
 */

const { faithful_api_token, api_url, dev } = require("../lib/getTokens")();
const getUntilDONE = require("../lib/getUntilDONE");
const prompt = require("../lib/prompt");
const sortTags = require("../lib/sortTags");
const toTitleCase = require("../lib/toTitleCase");

// remove extension and rest of path
const getNameFromPath = (path) => path.split("/").at(-1).split(".")[0];

const formatTag = (tag) => {
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
	if (!previousTextures.length && dev)
		console.log(
			"You are in developer mode! This disables database writing entirely for easier testing.",
		);

	const versions = await fetch(`${api_url}settings/versions`).then((res) => res.json());

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

		const existingIndex = out.uses.findIndex((use) => use.edition === edition);
		if (existingIndex == -1) {
			// use with correct edition doesn't exist yet, make a new one
			out.uses.push({
				edition,
				// name after first path in the use
				name: getNameFromPath(path),
				paths: [pathData],
			});
		} else out.uses[existingIndex].paths.push(pathData);

		const textureFolderIndex = path.split("/").findIndex((dir) => dir === "textures");
		out.tags = sortTags(
			[
				...out.tags,
				toTitleCase(edition),
				toTitleCase(textureFolderIndex == -1 ? null : path.split("/")[textureFolderIndex + 1]),
			].map(formatTag),
		);
	}

	// add back previous textures from chain
	const textures = [...previousTextures, out];
	console.log(JSON.stringify(textures, null, 4));

	// don't write when in dev mode
	if (dev) return createTextures(textures);

	// only write when the user is ready to, otherwise accumulate textures
	const confirm = await prompt(
		"Are you finished? Make sure this data looks correct before writing it: [Y/N] ",
	);

	if (confirm.toLowerCase() !== "y") {
		console.log("Starting new texture...\n\n");
		// continue adding textures to same array if not done (recursive)
		return createTextures(textures);
	}

	return fetch(`${api_url}textures/multiple`, {
		method: "post",
		headers: {
			bot: faithful_api_token,
			// stupid fetch api stuff, I wish I was using axios here lol
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(textures),
	}).then(async (res) => {
		const data = await res.json();
		if (!res.ok) return console.error(`An error occurred: ${JSON.stringify(data)}`);

		console.log(
			`Textures ${data
				.map((obj) => `[#${obj.id}]`)
				.join(", ")} successfully added!\nStarting new texture...\n\n`,
		);
		// start again from scratch now that chaining that particular one has stopped
		return createTextures();
	});
}

createTextures();
