const { writeFileSync } = require("fs");
const { api_url } = require("../lib/getTokens")();

async function orphanContributions() {
	const [contributions, textures] = await Promise.all([
		fetch(`${api_url}contributions/raw`)
			.then((res) => res.json())
			.then(Object.values),
		fetch(`${api_url}textures/raw`).then((res) => res.json()),
	]);

	const orphaned = contributions.filter((contrib) => !textures[contrib.texture]);
	writeFileSync("out.json", JSON.stringify(orphaned, null, 4));
	console.log("Written file to ./out.json!");
	process.exit();
}

orphanContributions();
