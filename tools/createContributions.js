/**
 * Create either a contribution or a series of contributions for any Faithful pack using a CLI interface
 * @author Evorp
 */

// ----- config ----- //

const CHAIN_CONTRIBUTIONS = true; // after the first contribution reuse the same date and authors until you're done
const DEV = true; // turn this off to actually enable writing

const PACK = "classic_faithful_32x"; // valid pack ID
const RESOLUTION = 32; // could probably do this automatically but eh

// ------------------ //

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

// would make this global but it's async
const mapUsernames = () =>
	fetch("https://api.faithfulpack.net/v2/users/names")
		.then((res) => res.json())
		.then((d) => d.reduce((acc, cur) => ({ ...acc, [cur.username?.toLowerCase()]: cur.id }), {}));

function parseTextureIndexing(indexes, textures) {
	// split by both spaces and commas if possible
	const stuffToSelect =
		indexes.includes(",") || indexes.includes(" ")
			? indexes
					.split(",")
					.map((i) => i.split(" "))
					.flat()
					.filter((i) => i)
			: [indexes];

	return [
		// remove duplicate selected textures
		...new Set(
			stuffToSelect
				.reduce((acc, item) => {
					// try for range
					if (isNaN(Number(item))) {
						const [min, max] = item.split("-").map((i) => Number(i));
						// not a range
						if (isNaN(min) || isNaN(max)) return acc;
						return [...acc, ...textures.slice(min - 1, max)];
					}

					// regular number
					return [...acc, textures[Number(item) - 1]];
				}, [])
				.filter((i) => i) // remove undefined items
				.map((t) => t.id),
		),
	];
}

/**
 * Prompt the user for a texture, give a choice menu if necessary, and return the texture IDs
 * @author Evorp
 * @returns texture IDs
 */
async function getTextures() {
	const textureName = await prompt("Give the name of the texture: ");
	const res = await fetch(`https://api.faithfulpack.net/v2/textures/${textureName}/all`);
	let textures = await res.json();

	if (!textures.length) return console.log("That texture doesn't exist!\n\nRestarting...");
	if (textures.length === 1) return [textures[0].id];

	/** @type {string} */
	const indexes = await prompt(
		`There are multiple textures: \n\t${textures
			.map((t, i) => `${i + 1}) [#${t.id}] ${t.paths[0].name}`)
			.join(
				"\n\t",
			)}\nChoose which texture(s) you want using the corresponding number or range (inclusive):\n`,
	);

	return parseTextureIndexing(indexes, textures);
}

/**
 * Prompt the user for a series of usernames and append them to an array
 * @returns array of usernames
 */
async function getUsernames() {
	const usernames = [];
	while (true) {
		const username = await prompt('Enter a username (use "DONE" to move to the next step): ');
		if (username == "DONE") break;
		usernames.push(username.toLowerCase());
	}
	// remove any accidentally empty items
	return usernames.filter((u) => u);
}

async function createContributions(previousContributions = []) {
	// initialize base with previous author and date if possible
	const base = previousContributions.length
		? { date: previousContributions[0].date, authors: previousContributions[0].authors }
		: {};

	if (!previousContributions.length) {
		if (DEV)
			console.log(
				"You are in developer mode! This disables database writing entirely for easier testing.",
			);
		const date = await prompt("Give the contribution date in the format YYYY-MM-DD: ");

		const usernames = await getUsernames();
		const usernameToID = await mapUsernames();

		base.date = new Date(date).getTime() + 82800000;
		if (!base.date) console.error(`${date} isn't a valid date!`);
		base.authors = usernames
			.map((u) => usernameToID[u] ?? console.error(`No user called "${u}" was found!`))
			.filter((v) => v);
	}

	const textures = await getTextures();
	if (!textures) return createContributions(previousContributions);

	const contributions = [
		...previousContributions,
		...textures.map((texture) => ({ ...base, texture, pack: PACK, resolution: RESOLUTION })),
	];

	console.log(contributions);
	// don't write when in dev mode
	if (DEV) return createContributions(CHAIN_CONTRIBUTIONS ? contributions : []);

	const confirm = await prompt(
		"Are you finished? Make sure this data looks correct before writing it [Y/N]: ",
	);
	if (confirm.toLowerCase() !== "y") {
		if (CHAIN_CONTRIBUTIONS) {
			console.log("Starting new contribution...\n\n");
			return createContributions(contributions);
		} else {
			// don't accumulate if chaining is off, outright restart instead
			console.log(
				"Ditching data and starting new contribution...\n\tEnable chaining to accumulate contributions!\n\n",
			);
			return createContributions();
		}
	}

	// either no chaining or chaining finished
	return fetch("https://api.faithfulpack.net/v2/contributions", {
		method: "post",
		headers: {
			bot: FAITHFUL_API_TOKEN,
			// stupid fetch api stuff, I wish I was using axios here lol
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(contributions),
	}).then(async (res) => {
		const data = await res.json();
		if (!res.ok) return console.error(`An error occurred: ${JSON.stringify(data)}`);

		console.log(data);
		// start again from scratch now that chaining that particular one has stopped
		return createContributions();
	});
}

createContributions();
