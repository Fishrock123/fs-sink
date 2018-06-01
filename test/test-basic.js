'use strict'

const fs = require('fs')
const assert = require('assert').strict

const FileSource = require('fs-source')
const FileSink = require('../index.js')

const fileSource = new FileSource('./test/fixtures/file')
const fileSink = new FileSink('./test/tmp/file')

fileSink.bindSource(fileSource, error => {
  if (error)
    console.error('Stream returned ->', error.stack)
  else {
    assert.deepEqual(fs.readFileSync('./test/fixtures/file'), fs.readFileSync('./test/tmp/file'))

    console.log('ok')
  }
})
