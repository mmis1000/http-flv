
var fs = require('fs').promises;
var crypto = require('crypto');

function hello(r) {
    r.headersOut['Content-Type'] = 'text/plain'
    var text = [
        "Hello world!",
        r.variables.request,
        r.variables.document_root,
        r.variables.uri
    ]
    r.return(200, text.join('\r\n'));
}

function hls(r) {
    if (!/\.m3u8/.test(r.variables.uri)) {
        return r.internalRedirect('@hls')
    }

    r.headersOut['Cache-Control'] = 'no-cache'
    r.headersOut['Access-Control-Allow-Origin'] = '*'
    r.headersOut['Access-Control-Allow-Credentials'] = 'true'
    r.headersOut['Content-Type'] = 'application/vnd.apple.mpegurl'

    function sendIfNoneMatch (retry) {
        fs.readFile(r.variables.request_filename).then(res => {
            var codec = crypto.createHash('md5')
            codec.update(res)
            var hash = codec.digest('base64')
            
            if (r.headersIn['If-None-Match'] === hash && retry > 0) {
                r.headersOut['Hls-Fetch-Too-Fast'] = '1'
                setTimeout(function () {
                    sendIfNoneMatch (retry - 1)
                }, 100)
                return
            }

            r.headersOut['Etag'] = hash

            r.return(200, res);
        })
    }

    sendIfNoneMatch(2)

    // r.headersOut['Content-Type'] = 'text/plain'
    // var text = [
    //     "Hello world!",
    //     r.variables.request,
    //     r.variables.document_root,
    //     r.variables.realpath_root,
    //     r.variables.request_filename,
    //     r.variables.uri
    // ]
    // r.return(200, text.join('\r\n'));
}

export default { hello, hls };
