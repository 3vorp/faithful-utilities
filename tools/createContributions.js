/**
 * Create either a contribution or a series of contributions for any Faithful pack using a CLI interface
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

const CHAIN_CONTRIBUTIONS = false; // after the first contribution reuse the same date and authors until you're done
const DEV = false; // turn this off to actually enable writing

const PACK = "classic_faithful_32x";
const RESOLUTION = 32;

const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

// will take some time
const mapUsernames = () =>
	fetch("https://api.faithfulpack.net/v2/users/names")
		.then((res) => res.json())
		.then((d) => d.reduce((acc, cur) => ({ ...acc, [cur.username?.toLowerCase()]: cur.id }), {}));

/**
 * Prompt the user for a texture, give a choice menu if necessary, and return the texture ID
 * @author Evorp
 * @returns texture ID
 */
async function getTextures() {
	const textureName = await prompt("Give the name of the texture: ");
	const res = await fetch(`https://api.faithfulpack.net/v2/textures/${textureName}/all`);
	let textures = await res.json();

	if (!textures.length) return console.log("That texture doesn't exist!\n\nRestarting...");

	if (textures.length > 1) {
		const i = await prompt(
			`There are multiple textures: \n\t${textures
				.map((t, i) => `${i + 1}) [#${t.id}] ${t.paths[0].name}`)
				.join(
					"\n\t",
				)}\nChoose which texture you want using the corresponding number or range (inclusive): `,
		);

		if (i.includes("-")) {
			const [min, max] = i.split("-");
			textures = textures.slice(min - 1, max);
		} else textures = [textures[i - 1]];
	}

	return textures.map((t) => t.id);
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
	return usernames;
}

async function createContributions(previousContributions = []) {
	// initialize base with previous author and date if possible
	const base = previousContributions.length
		? { date: previousContributions[0].date, authors: previousContributions[0].authors }
		: {};

	if (!previousContributions.length) {
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

	if (CHAIN_CONTRIBUTIONS) {
		// only write when the user is ready to, otherwise accumulate contributions
		const confirm = await prompt(
			"Are you finished? Make sure this data looks correct before writing it [Y/N]: ",
		);
		if (confirm.toLowerCase() !== "y") {
			console.log("Starting new contribution...\n\n");
			// continue adding contributions to same array if not done (recursive)
			return createContributions(contributions);
		}
	}

	// don't write when in dev mode
	if (DEV) return createContributions(CHAIN_CONTRIBUTIONS ? contributions : []);

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
