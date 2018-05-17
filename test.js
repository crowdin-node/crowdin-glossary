const Glossary = require('.')
const csvParser = require('csv-parser')
const stringToStream = require('string-to-stream')
const nock = require('nock')

// disallow all network requests
nock.disableNetConnect()

test('exports a function', () => {
  expect(typeof Glossary).toBe('function')
})

describe('init', () => {
  test('project is required', () => {
    expect(() => {
      Glossary()
    }).toThrow('project is required')
  })

  test('crowdinKey is required', () => {
    expect(() => {
      Glossary({project: 'foo'})
    }).toThrow('crowdinKey or process.env.CROWDIN_KEY is required')
  })

  test('crowdinKey falls back to CROWDIN_KEY environment variable', () => {
    const existing = process.env.CROWDIN_KEY
    process.env.CROWDIN_KEY = '123'
    Glossary({project: 'foo'})
    if (existing) {
      process.env.CROWDIN_KEY = existing
    } else {
      delete process.env.CROWDIN_KEY
    }
  })
})

describe('glossary.add()', () => {
  const glossary = Glossary({project: 'foo', crowdinKey: 'xyz'})

  test('requires a term', () => {
    expect(() => {
      glossary.add(null)
    }).toThrow('term is required')
  })

  test('requires a description', () => {
    expect(() => {
      glossary.add('term', null)
    }).toThrow('description is required')
  })

  test('does not allow duplicate terms to be added', () => {
    expect(() => {
      glossary.add('IPC', 'inter-process communication')
      glossary.add('IPC', 'inter-process communication')
    }).toThrow('term IPC has already been added')
  })

  test('properly handles JS builtins like `constructor`', () => {
    glossary.add('constructor', 'a thing')
    glossary.add('toString', 'a thing')
    glossary.add('hasOwnProperty', 'a thing')
  })
})

describe('glossary.fromFile()', () => {
  const glossary = Glossary({project: 'bar', crowdinKey: 'xyz'})

  test('is empty', () => {
    expect(() => {
      glossary.fromFile('./test/empty-file.json')
    }).toThrow('The file seems to be empty')
  })
})

describe('glossary.webpage', () => {
  test('is a crowdin URL', () => {
    const glossary = Glossary({project: 'foo-bar', crowdinKey: 'xyz'})
    expect(glossary.webpage).toBe('https://crowdin.com/project/foo-bar/settings#glossary')
  })
})

describe('glossary.csv', () => {
  test('produces a valid CSV string', () => {
    const glossary = Glossary({project: 'foo', crowdinKey: 'xyz'})
    glossary.add('a', 'apples alligators anchovies')
    glossary.add('b', 'blissful bubble bath')
    glossary.add('c', 'collecting "crunchy" cornichons')
    const results = {}
    stringToStream(glossary.csv)
      .pipe(csvParser(['term', 'description']))
      .on('data', ({term, description}) => {
        results[term] = description
      })
      .on('end', () => {
        expect(Object.keys(results)).toEqual(['a', 'b', 'c'])
        expect(Object.values(results)).toEqual([
          'apples alligators anchovies',
          'blissful bubble bath',
          'collecting "crunchy" cornichons'
        ])
      })
  })
})

describe('glossary.upload()', () => {
  test('POSTs to the Crowdin API', async () => {
    const glossary = Glossary({project: 'foo', crowdinKey: 'xyz'})
    const mock = nock('https://api.crowdin.com')
      .post('/api/project/foo/upload-glossary')
      .query({key: 'xyz'})
      .reply(200, 'success')

    glossary.add('a', 'apples')
    glossary.add('b', 'bananas')
    glossary.add('c', 'cornichons')
    await glossary.upload()
    expect(mock.isDone()).toBe(true)
  })

  // test('throws an error if no entries have been added')

  test('handles errors', async () => {
    // capture console.error() messages
    const logs = []
    const errors = message => (logs.push(message))
    console['error'] = jest.fn(errors)

    const glossary = Glossary({project: 'foo', crowdinKey: 'xyz'})
    const mock = nock('https://api.crowdin.com')
      .post('/api/project/foo/upload-glossary')
      .query({key: 'xyz'})
      .reply(500, 'something is wrong')

    await glossary.upload()

    expect(logs.length).toBe(2)
    expect(logs[0]).toBe('Problem uploading glossary')
    expect(logs[1].message).toMatch(/Response code 500/)
    expect(mock.isDone()).toBe(true)
  })
})
