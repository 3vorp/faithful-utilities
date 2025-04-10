> [!WARNING]
> Some of these tools have been made redundant by Faithful web app improvements, and most of the others are planned to be migrated at some point. That's essentially to say that this repository has effectively entered a maintenance-only stage and no new tools are planned (all future tool ideas will likely be integrated into the web app directly where possible).

These are a collection of various utilities I've made to ease Faithful database management and usage.

**All utilities are stored in the [`tools/`](./tools/) folder.**

## Installing

All of these programs are written in JavaScript for usage with the Node.js interpreter. First, install Node from https://nodejs.org (either LTS or latest is fine).

After that's done, you can run any of these files using this command.

```bash
node your/file/path/here
```

## Configuration and Authentication

If you get a warning about missing tokens, this is because you need to use privileged endpoints that not everyone can access. Make sure there's a `tokens.json` file present in your repository folder—you can simply rename the provided [`tokens.example.json`](./tokens.example.json) file and add necessary authorization.
