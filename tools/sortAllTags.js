const sortTags = require("../lib/sortTags");
const { faithful_api_token, dev } = require("../lib/getTokens")();

/**
 * Sort the tags of all textures that aren't properly sorted.
 * @author Evorp
 */
async function sortAllTags() {
	const res = await fetch("https://api.faithfulpack.net/v2/textures/raw");
	const textures = await res.json();
	Promise.all(
		Object.values(textures).map((texture) => {
			const sorted = sortTags(texture.tags);
			if (JSON.stringify(sorted) == JSON.stringify(texture.tags)) return;
			if (dev)
				return console.log(
					`Unsorted tags for [#${texture.id}] (${texture.name}): ${texture.tags.join(", ")}`,
				);

			console.log(`Fixing [#${texture.id}] (${texture.name}): ${texture.tags.join(", ")}...`);
			return fetch(`https://api.faithfulpack.net/v2/textures/${texture.id}`, {
				method: "put",
				headers: {
					bot: faithful_api_token,
					// stupid fetch api stuff, I wish I was using axios here lol
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name: texture.name, tags: sorted }),
			});
		}),
	)
		.then((res) => res.forEach((r) => (r ? r.ok : "")))
		.then(() => console.log(dev ? "Dev mode is on!" : "All tags have been fixed"));
}

sortAllTags();
