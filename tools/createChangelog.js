/**
 * Generate a basic formatted changelog for a specified pack after a given date.
 * @author Evorp
 */

const { writeFileSync } = require("fs");
const prompt = require("../lib/prompt");
const mapUsernames = require("../lib/mapUsernames");
const toTitleCase = require("../lib/toTitleCase");
const { api_url } = require("../lib/getTokens")();

async function getPacks() {
	const res = await fetch(`${api_url}packs/search?type=submission`);
	const allPacks = await res.json();
	return allPacks.map((pack) => ({ id: pack.id, name: pack.name }));
}

/**
 * Prompt the user for a date and pack, and generate a changelog based off the information given and write it to a text file.
 * @author Evorp
 */
async function createChangelog() {
	const IDtoUsername = await mapUsernames(false);
	const YMD = await prompt("Please give the date since the previous changelog (YYYY-MM-DD): ");
	const res = await fetch(
		`${api_url}contributions/between/${new Date(YMD).getTime()}/${new Date().getTime()}`,
	);
	const allContributions = await res.json();
	const packs = await getPacks();

	// choice menu is easier than manually entering in pack ids
	const packIndex = await prompt(
		`Please provide the pack to create a changelog for:\n\t${packs
			.map(({ name }, i) => `${i + 1}) ${name}`)
			.join("\n\t")}\nChoose which pack you want using the corresponding number: `,
	);

	// subtract one because the user-facing option uses 1-indexed array
	const selectedPack = packs[packIndex - 1];
	console.log("Collecting data...");

	// get author names
	const packContributions = allContributions
		.filter((contribution) => contribution.pack === selectedPack.id)
		.map((contribution) => {
			contribution.authors = contribution.authors.map(
				(author) => IDtoUsername[author] ?? "Anonymous",
			);
			return contribution;
		});

	const textures = await fetch(`${api_url}textures/raw`).then((res) => res.json());

	// merge the two objects by id (faster than fetching individually)
	const duplicateData = packContributions
		.map((contribution) => ({
			...contribution,
			...textures[contribution.texture],
		}))
		.map((data) => {
			data.tags = data.tags
				.filter((tag) => !["java", "bedrock"].includes(tag.toLowerCase()))
				.sort();
			return data;
		});

	const finalData = Object.values(
		duplicateData.reduce((acc, cur) => {
			// newer date wins
			if (acc[cur.texture] === undefined || acc[cur.texture]?.date < cur.date)
				acc[cur.texture] = cur;
			return acc;
		}, {}),
	);

	// group by texture tag (easier than going off paths)
	const formatted = finalData.reduce((acc, texture) => {
		acc[texture.tags[0]] ||= [];
		acc[texture.tags[0]].push(`${toTitleCase(texture.name)} (${texture.authors.join(", ")})`);
		return acc;
	}, {});

	console.log(formatted);

	writeFileSync("./changelog.json", JSON.stringify(formatted, null, 4));
	writeFileSync(
		"./changelog.md",
		Object.entries(formatted)
			.map(([k, v]) => `## ${k}\n- ${v.join("\n- ")}`)
			.join("\n\n"),
	);
	console.log("Written changelog file to ./changelog.json and ./changelog.md!");
	console.log("Remember to sort this into Added, Changed, and Fixed categories before adding it to the post.");
	process.exit();
}

createChangelog();
