/**
 * Slimmed down version of the Faithful webapp texture adder, for faster texture creation
 * @author Evorp
 */

let FAITHFUL_API_TOKEN;
try {
	FAITHFUL_API_TOKEN = require("../tokens.json").faithful_api_token;
} catch {
	console.error(
		"You need to create a ../tokens.json file with your Faithful API token!\n" +
			"I recommend cloning the GitHub repository and renaming the ./tokens.example.json file.",
	);
	process.exit(1);
}

const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

const toTitleCase = (str) =>
	str
		.split("_")
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");

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

async function getPaths() {
	const paths = [];
	while (true) {
		const pathName = await prompt('Give a texture path (use "DONE" to complete: ');
		if (pathName == "DONE") break;
		paths.push(pathName);
	}
	return paths;
}

async function createTextures(previousTextures = []) {
	const out = {
		tags: [],
		uses: [],
	};

	const versions = await fetch("https://api.faithfulpack.net/v2/settings/versions").then((res) =>
		res.json(),
	);

	const paths = await getPaths();
	if (!paths.length) {
		console.error("You didn't specify enough paths!");
		return createTextures(previousTextures);
	}

	// remove extension and rest of path
	out.name = paths[0].split("/").at(-1).split(".")[0];

	for (const path of paths) {
		const edition = path.startsWith("assets") ? "java" : "bedrock";

		// when creating textures, paths are stored inside the use data
		const pathData = {
			name: path,
			versions: [versions[edition][0]],
			mcmeta: false,
		};

		const existingIndex = out.uses.findIndex((v) => v.edition === edition);
		if (existingIndex == -1) {
			// parent use not found yet
			out.uses.push({
				edition: edition,
				name: out.name,
				paths: [pathData],
			});
		} else out.uses[existingIndex].paths.push(pathData);

		const textureFolderIndex = path.split("/").findIndex((v) => v == "textures");
		out.tags = [
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
		// continue adding contributions to same array if not done (recursive)
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
