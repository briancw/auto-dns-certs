const {domains, email, awsKeys, useLive} = require('./config.js')
const leChallengeR53 = require('./le-challenge-r53.js').create({awsKeys})
const server = useLive ? 'https://acme-v02.api.letsencrypt.org/directory' : 'https://acme-staging-v02.api.letsencrypt.org/directory'

const greenlock = require('greenlock').create({
    version: 'draft-12',
    server,
    configDir: '/tmp/acme/etc',
    challenges: {
        'dns-01': leChallengeR53,
    },
})

const opts = {
    domains,
    email,
    agreeTos: true, // Accept Let's Encrypt v2 Agreement
    communityMember: false, // Help make Greenlock better by submitting
    rsaKeySize: 2048,
    challengeType: 'dns-01',
}

greenlock.register(opts).then(function(certs) {
    console.log(certs)
    // privkey, cert, chain, expiresAt, issuedAt, subject, altnames
}, function(err) {
    console.error(err)
})
