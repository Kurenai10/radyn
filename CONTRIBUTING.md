# Contributing to Radyn

Thanks for your interest in Radyn. Bug reports, feature ideas and pull requests are all welcome.

## Reporting bugs and requesting features

- Search [existing issues](https://github.com/Kurenai10/radyn/issues) first.
- Use the issue templates. For bugs, include your OS, the Radyn version, steps to reproduce, the exact error text and the terminal output.

## Development setup

```bash
git clone https://github.com/Kurenai10/radyn.git
cd radyn
npm install
npm start      # run the app
npm test       # run the test suite (must pass before you open a PR)
```

Requirements: Node.js 20 or newer, Windows 10/11 or Linux (x64).

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Keep changes focused: one fix or feature per pull request.
3. Add or update tests in `test/` for behavior you change. Run `npm test`.
4. Keep the code style consistent with the surrounding code (plain JavaScript, no build step for the renderer).
5. If you change user-facing text, update all five languages in `src/strings.js` (the test suite checks that the keys match). Update `README.md` and `README.tr.md` when behavior or setup changes.
6. Open the pull request with a clear description of what changed and why.

## Project principles

- **Lightweight:** avoid new dependencies unless they clearly pay off.
- **Privacy:** no telemetry. Network calls must be documented in the README's privacy section.
- **Security:** the renderer stays sandboxed and only talks to the main process through `preload.js`.

## Translations

String tables live in `src/strings.js`. A new language needs every key translated, a `LANG_NAMES` entry, and an entry in the language selector in `renderer/index.html`.

## Code of conduct

Be respectful and constructive. Harassment or discrimination of any kind is not acceptable.
