# crowdin-glossary

Create and upload translation glossaries using the Crowdin API

![glossary screenshot](https://user-images.githubusercontent.com/2289/36569408-8a4ad454-17e2-11e8-8a5b-9c394db0eafd.png)

> With Glossary, you can create, store, and manage all the project terminology in one place. The main aim of terminology is to explain some specific terms or the ones often used in the project, so they can be translated properly and consistently.

See
[support.crowdin.com/glossary](https://support.crowdin.com/glossary)
and
[support.crowdin.com/api/upload-glossary](https://support.crowdin.com/api/upload-glossary) for details.

## Installation

```sh
npm install crowdin-glossary --save
```


## Usage

```js
const glossary = require('crowdin-glossary')({
  project: 'your-crowdin-project',
  crowdinKey: process.env.CROWDIN_KEY
})

glossary.add('IME', 'Input Method Editor. A program that...')
glossary.add('IPC', 'Inter-Process Communication. Electron uses IPC to send...')
glossary.add('MAS', 'Acronym for Apple Mac App Store.')

glossary.upload()
```

## API

### `require('crowdin-glossary')(opts)`

Returns a new empty glossary instance.

- `opts` Object
  - `project` String (required) - The name of your project on Crowdin
  - `crowdinKey` String (required) - If not supplied as an option, then `process.env.CROWDIN_KEY` will be the fallback.
  - `openAfterUpload` Boolean (optional) - Open the project glossary in web browser after upload is complete. Defaults to `true`. This feature is disabled on CI environments by detecting `process.env.CI`.
  - `languageCode` String (optional) - Language code of glossary. Default is `en`.

### `glossary.add(term, description)`

Adds an entry to the glossary instance. Entries only exist in memory until you
call `glossary.upload()`

- `term` String (required)
- `description` String (required)

### `glossary.upload()`

Async function that uploads all the added terms to Crowdin.
On success, it returns the result of the POST request.
On failure, it logs an error.

### `glossary.entries`

A getter that returns the existing added entries as a key-value object.

### `glossary.webpage`

A getter that returns the web URL of your project's glossary on crowdin.com

### `glossary.csv`

A getter that converts your entries into a valid CSV string for upload to
Crowdin. Used for internal purposes.

## License

MIT
