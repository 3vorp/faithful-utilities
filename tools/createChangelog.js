/**
 * Generate a basic formatted changelog for a specified pack after a given date.
 * @author Evorp
 */

const { writeFileSync } = require("fs");
const prompt = require("../lib/prompt");
const mapUsernames = require("../lib/mapUsernames");
const toTitleCase = require("../lib/toTitleCase");

async function getPacks() {
	const res = await fetch("https://api.faithfulpack.net/v2/settings/submission.packs");
	const allPacks = await res.json();
	return Object.entries(allPacks).map(([k, v]) => ({ id: k, name: v.display_name }));
}

/**
 * Prompt the user for a date and pack, and generate a changelog based off the information given and write it to a text file.
 * @author Evorp
 */
async function createChangelog() {
	const IDtoUsername = await mapUsernames(false);
	const YMD = await prompt("Please give the date since the previous changelog (YYYY-MM-DD): ");
	const res = await fetch(
		`https://api.faithfulpack.net/v2/contributions/between/${new Date(
			YMD,
		).getTime()}/${new Date().getTime()}`,
	);
	const allContributions = await res.json();
	const packs = await getPacks();

	// choice menu is easier than manually entering in pack ids
	const packIndex = await prompt(
		`Please provide the pack to create a changelog for:\n\t${packs
			.map((v, i) => `${i + 1}) ${v.name}`)
			.join("\n\t")}\nChoose which pack you want using the corresponding number: `,
	);

	console.log(
		"Collecting data...\nThis can take some time for big changelogs, please be patient...",
	);

	// remove unnecessary info to save time later on
	const packContributions = allContributions
		.filter((contribution) => contribution.pack == packs[packIndex - 1].id)
		.map((contribution) => ({
			id: contribution.texture,
			authors: contribution.authors.map((author) => IDtoUsername[author] ?? "Anonymous"),
		}));

	// group ids into 30-long nested arrays
	const groupedIDs = packContributions
		.map((contribution) => contribution.id)
		.reduce((acc, cur, index) => {
			if (index % 30 === 0) acc.push([]);
			acc.at(-1).push(cur);
			return acc;
		}, []);

	const textureData = (
		await Promise.all(
			groupedIDs.map(async (ids) => {
				// get texture data in batches of 30
				return await fetch(`https://api.faithfulpack.net/v2/textures/${ids.join(",")}`)
					.then((res) => res.json())
					.catch(() => null);
			}),
		)
	)
		.flat()
		.map((texture) => ({
			...texture,
			tags: texture.tags.filter((tag) => !["java", "bedrock"].includes(tag.toLowerCase())),
		}));

	// merge the two objects by id
	const finalData = packContributions.map((contribution) => ({
		...contribution,
		...textureData.find((texture) => texture.id == contribution.id),
	}));

	// group by texture tag (easier than going off paths)
	const formatted = finalData.reduce(
		(acc, texture) => ({
			...acc,
			[texture.tags[0]]: [
				...(acc[texture.tags[0]] ?? []),
				`${toTitleCase(texture.name)} (${texture.authors.join(", ")})`,
			],
		}),
		{},
	);

	console.log(formatted);

	writeFileSync("./changelog.json", JSON.stringify(formatted, null, 4));
	writeFileSync(
		"./changelog.md",
		Object.entries(formatted)
			.map(([k, v]) => `## ${k}\n- ${v.join("\n- ")}`)
			.join("\n\n"),
	);
	console.log(
		"Written changelog file to ./changelog.json and ./changelog.md!\nRemember this is not directly compatible with website posts, use a JSON to YAML parser like https://json2yaml.com/ for that.",
	);
	process.exit();
}

createChangelog();
