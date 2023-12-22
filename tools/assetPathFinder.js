/**
 * Find paths that don't have assets/minecraft at the start when they probably should.
 * @author Evorp
 */
async function assetPathFinder() {
    const paths = await fetch(`https://api.faithfulpack.net/v2/paths/raw`).then((res) =>
        res.json()
    );
    const results = [];
    for (const path of Object.values(paths)) {
        if (path.name.startsWith("assets")) continue;
        const versions = path.versions.sort(minecraftSorter);
        if (
            versions.includes("bedrock-latest") ||
            versions.includes("1.4.6") ||
            versions.includes("b1.7.3")
        )
            continue;
        console.log(path);

        const shownVersions = versions.length == 1
            ? versions[0]
            : `${versions[0]} - ${versions[versions.length - 1]}`;
        results.push(`[#${path.use.match(/\d+/)?.[0]}] - ${path.name} [${shownVersions}]`);
    }

    require("fs").writeFileSync("out.txt", results.join("\n"));
    console.log("Written file to ./out.txt!");
	process.exit();
}

/**
 * Sorter for Minecraft versions
 * @author TheRolf
 */
function minecraftSorter(a, b) {
    const aSplit = a.split(".").map((s) => parseInt(s));
    const bSplit = b.split(".").map((s) => parseInt(s));

    const upper = Math.min(aSplit.length, bSplit.length);
    let i = 0;
    let result = 0;
    while (i < upper && result == 0) {
        result = aSplit[i] == bSplit[i] ? 0 : aSplit[i] < bSplit[i] ? -1 : 1; // each number
        ++i;
    }

    if (result != 0) return result;

    return aSplit.length == bSplit.length ? 0 : aSplit.length < bSplit.length ? -1 : 1; // longer length wins
}

assetPathFinder();