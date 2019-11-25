const assert = require('assert')
const fs = require('fs')
const {post} = require('got')
const FormData = require('form-data')
const tmp = require('tmp')
const open = require('open')
const {stringify: csvify} = require('csv-string')

module.exports = function (opts = {}) {
  return new Glossary(opts)
}

class Glossary {
  constructor (opts) {
    const defaults = {
      openAfterUpload: true
    }
    Object.assign(this, defaults, opts)

    if (!this.crowdinKey) this.crowdinKey = process.env.CROWDIN_KEY

    assert(this.project, 'project is required')
    assert(this.crowdinKey, 'crowdinKey or process.env.CROWDIN_KEY is required')

    this._entries = {}
    return this
  }

  add (term, description) {
    assert(term && term.length, 'term is required')
    assert(description && description.length, 'description is required')
    assert(!(Object.keys(this.entries).includes(term)), `term ${term} has already been added`)
    this._entries[term] = description
  }

  fromFile (filename) {
    let glossary = require(filename)
    assert(Object.keys(glossary).length, 'The file seems to be empty')
    glossary.forEach(term => {
      assert(term, 'Term or description not found')
      this.add(term[0], term[1])
    })
    this._entries = glossary
  }

  get entries () {
    return this._entries
  }

  get csv () {
    return Object.keys(this.entries).reduce((acc, term) => {
      const description = this.entries[term]
      return acc.concat(csvify([term, description]))
    }, '')
  }

  get webpage () {
    return `https://crowdin.com/project/${this.project}/settings#glossary`
  }

  async upload () {
    const url = `https://api.crowdin.com/api/project/${this.project}/upload-glossary?key=${this.crowdinKey}`

    const glossaryFile = tmp.fileSync({postfix: '.csv'}).name
    fs.writeFileSync(glossaryFile, this.csv)

    const form = new FormData()
    form.append('scheme', 'term_en,description_en')
    form.append('file', fs.createReadStream(glossaryFile))
    form.append('json', 'true')

    const result = await post(url, {body: form})
      .then(() => {
        if (this.openAfterUpload && !process.env.CI) {
          console.log(`Uploaded glossary! Opening ${this.webpage} in your browser`)
          open(this.webpage)
        } else {
          console.log(`Uploaded glossary! See ${this.webpage}`)
        }
      })
      .catch(err => {
        console.error('Problem uploading glossary')
        console.error(err)
      })

    return result
  }
}
