'use strict'

const tap = require('tap')
const fs = require('fs')
const path = require('path')

const { AssertionSource } = require('bob-streams')
const FileSink = require('../')

tap.test('test file write', t => {
  t.plan(3)
  const filename = path.join(__dirname, '.tmp', 'test-write-file.txt')

  try {
    fs.unlinkSync(filename)
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
  }

  const expects = [
    'Hello World\n'
  ]

  const source = new AssertionSource(expects)
  const fileSink = new FileSink(filename)

  fileSink.bindSource(source).start(error => {
    t.error(error, 'Exit Callback received unexpected error')

    fs.readFile(filename, { encoding: 'utf8' }, (err, file) => {
      t.error(err, 'ReadFile issue')
      t.equal(file, expects.join(''), 'written output correctness', expects)
      t.end()
    })
  })
})
