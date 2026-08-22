# Privacy

ToClash is designed to process sensitive proxy links locally.

- Conversion runs entirely in the browser.
- Input is held in volatile page memory and is not saved by ToClash.
- Input is not added to the page URL, analytics, logs, DOM identifiers, or metadata attributes.
- ToClash has no backend conversion endpoint and does not use third-party conversion services.
- Copy and download operations occur only after the user selects the corresponding action.

The hosting provider may process ordinary web-request metadata when serving static application files. Those requests do not contain proxy links unless a user independently puts sensitive information into a URL, which ToClash never requires.

Users remain responsible for protecting clipboard contents and downloaded YAML files.
