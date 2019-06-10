# FS Sink (BOB)

A file system sink for the [BOB](https://github.com/Fishrock123/bob) streaming protocol.

## Usage

```js
const FileSink = require('fs-sink')
new FileSink(path, options)
```

Implements a [BOB sink](https://github.com/Fishrock123/bob/blob/master/reference-sink.js) to a file.

### Example

```js
const FileSink = require('fs-source')

const source = new MyBOBSink()
const sink = new FileSink('my-file')

sink.bindSource(source)
sink.start(error => {
  if (error)
    console.error('Stream returned error ->', error.stack)
  else {
    console.log('ok')
  }
})
```

See [test-basic](test/test-basic) for a good working example.

## License

[MIT Licensed](license) — _[Contributions via DCO 1.1](contributing.md#developers-certificate-of-origin)_
