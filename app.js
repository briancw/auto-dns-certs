const path = require('path')
const config = require('./config.js')
const {domains, email, useLive} = config
const server = useLive ? 'https://acme-v02.api.letsencrypt.org/directory' : 'https://acme-staging-v02.api.letsencrypt.org/directory'
const configDir = path.resolve(__dirname, 'certs')

const greenlock = require('greenlock').create({
    version: 'draft-12',
    server,
    configDir: '/tmp/acme/etc',
    challenges: {
        'dns-01': require('./le-challenge-r53.js').create(config),
    },
    store: require('le-store-certbot').create({
        configDir,
        privkeyPath: `${configDir}/live/:hostname/privkey.pem`,
        fullchainPath: `${configDir}/live/:hostname/fullchain.pem`,
        certPath: `${configDir}/live/:hostname/cert.pem`,
        chainPath: `${configDir}/live/:hostname/chain.pem`,
        logsDir: path.resolve(__dirname, 'logs'),
        // debug: true,
        // webrootPath: '~/acme/srv/www/:hostname/.well-known/acme-challenge',
    }),
})

const opts = {
    domains,
    email,
    agreeTos: true, // Accept Let's Encrypt v2 Agreement
    communityMember: false, // Help make Greenlock better by submitting
    rsaKeySize: 2048,
    challengeType: 'dns-01',
}

console.log(`Running in ${useLive ? 'Live' : 'Test'} mode`)

greenlock.register(opts)
.then(({subject}) => {
    console.log(`${subject} complete`)
    console.log(`Certificates have been placed in ${configDir}`)
})
.catch(console.error)
