'use strict'

const fs = require('fs')
const status = require('bob-status')

module.exports = FileSink

function FileSink(path, options) {
  if (!(this instanceof FileSink)) {
    return new FileSink(path, options)
  }

  if (options !== undefined && typeof options !== 'object') {
    throw new TypeError(`options MUST be an Object, found ${typeof options}`)
  }

  options = copyObject(options)

  if (path !== undefined && typeof path !== 'string') {
    throw new TypeError(`path MUST be a String, found ${typeof path}`)
  }

  this.path = path

  this.fd = options.fd === undefined ? null : options.fd
  this.flags = options.flags === undefined ? 'w' : options.flags
  this.mode = options.mode === undefined ? 0o666 : options.mode

  this.buffer = null

  if (options.start !== undefined) {
    if (typeof options.start !== 'number') {
      throw new TypeError(`options.start MUST be a Number, found ${typeof options.start}`)
    }
    if (options.start < 0) {
      const errVal = `{start: ${options.start}}`
      throw new RangeError(`start must be >= 0, found ${errVal}`)
    }

    this.pos = options.start
  } else {
    this.pos = 0
  }

  // XXX(Fishrock123):
  // streams3 opens the FD here, but I think error handling might be better if
  // it is opened during pull flow.
  //
  // That has some disadvantages, namely around telling when to actually open
  // the file, but also the delayment of error until after stream construction.
  //
  // if (typeof this.fd !== 'number')
  //   this.open()
}

FileSink.prototype.bindSource = function bindSource (source, bindCb) {
  if (typeof bindCb !== 'function') {
    throw new TypeError(`bindCb must be a function, found ${typeof bindCb}`)
  }

  source.bindSink(this)

  this.source = source
  this.bindCb = bindCb

  this.begin()
}

FileSink.prototype.begin = function begin () {
  if (typeof this.fd !== 'number') {
    fs.open(this.path, this.flags, this.mode, (error, fd) => {
      if (error) {
        return this.source.pull(error, Buffer.alloc(0))
      }

      this.fd = fd

      this.doPull()
    })
  } else {
    this.doPull()
  }
}

FileSink.prototype.doPull = function doPull () {
  if (!Buffer.isBuffer(this.buffer)) {
    try {
      this.buffer = Buffer.allocUnsafe(64 * 1024)
    } catch (error) {
      return this.bindCb(error)
    }
  }

  this.source.pull(null, this.buffer)
}

FileSink.prototype.next = function next (source_status, error, _buf, bytes) {
  if (source_status === undefined) {
    this.source.pull(new Error('undefined status'), Buffer.alloc(0))
    return
  }

  if (source_status === status.end) {
    return fs.close(this.fd, (closeError) => {
      if (closeError) {
        this.source.pull(closeError, Buffer.alloc(0))
      }
      this.bindCb()
    })
  }

  if (error) {
    return fs.close(this.fd, (closeError) => {
      if (closeError) {
        this.source.pull(closeError, Buffer.alloc(0))
      }
      this.bindCb(error)
    })
  }

  if (typeof this.fd !== 'number') {
    return this.bindCb(new Error('FD is not a number'))
  }

  const buf = Buffer.isBuffer(_buf) ? _buf : bytes === this.buffer.length ? this.buffer : this.buffer.slice(0, bytes)

  fs.write(this.fd, buf, 0, bytes, this.pos, (er, bytesWritten) => {
    if (error) {
      this.source.pull(error, Buffer.alloc(0))
    } else {
      if (bytesWritten > 0) {
        this.pos += bytesWritten
      }
      // else ...? What happens if nothing is written?

      this.doPull()
    }
  })
}

/* ## Helpers ## */

function copyObject(source) {
  var target = {}
  for (var key in source)
    target[key] = source[key]
  return target
}
