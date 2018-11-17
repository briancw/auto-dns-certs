const AWS = require('aws-sdk')

const Challenge = module.exports

Challenge.create = function(defaults) {
    return {
        getOptions: function() {
            return defaults || {}
        },
        set: Challenge.set,
        get: Challenge.get,
        remove: Challenge.remove,
        loopback: Challenge.loopback,
        test: Challenge.test,
    }
}

// Show the user the token and key and wait for them to be ready to continue
Challenge.set = function(args, domain, challenge, keyAuthorization, cb) {
    const keyAuthDigest = require('crypto').createHash('sha256').update(keyAuthorization || '').digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

    const {awsKeys} = this.getOptions()
    const {accessKey, secretKey} = awsKeys

    AWS.config.accessKeyId = accessKey
    AWS.config.secretAccessKey = secretKey

    const R53 = new AWS.Route53()

    console.log(accessKey, secretKey)

    console.info(domain + '\tTXT ' + keyAuthDigest + '\tTTL 60')
    console.info('this will callback in 5 seconds')

    setTimeout(() => {
        cb(null)
    }, 5000)
}

// nothing to do here, that's why it's manual
Challenge.get = function(defaults, domain, challenge, cb) {
    cb(null)
}

// might as well tell the user that whatever they were setting up has been checked
Challenge.remove = function(args, domain, challenge, cb) {
    console.info('Challenge for \'' + domain + '\' complete. You may remove it.')
    cb(null)
    // });
}
