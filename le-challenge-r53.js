/* eslint-disable require-jsdoc, max-params */
const AWS = require('aws-sdk')
const {
    ttl = 60,
    ttlBuffer = 10,
    retryTime = 20,
    maxSleep = 80,
    awsHostedZoneId,
} = require('./config.js')

// Status returned by AWS to indicate that propigation to their servers is complete.
const PROPIGATED_KEY = 'INSYNC'
const ttlWait = ttl + ttlBuffer
const attempts = Math.floor(maxSleep / retryTime)

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

// Show the user the token and key and wait for them to be ready to continue.
Challenge.set = async function(args, domain, challenge, keyAuthorization, cb) {
    const keyAuthDigest = require('crypto').createHash('sha256').update(keyAuthorization || '').digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

    const {awsKeys} = this.getOptions()
    const {accessKey, secretKey} = awsKeys

    AWS.config.accessKeyId = accessKey
    AWS.config.secretAccessKey = secretKey

    const route53 = new AWS.Route53()

    // Get all hosted zones and find the proper one for this domain.
    let data = await route53.listHostedZonesByName().promise()

    const {HostedZones: zones} = data
    const domainPlusDot = domain + '.'
    let zoneId
    let name
    for (let {Name: fullName, Id: id} of zones) {
        // If a name is provided use it.
        if (awsHostedZoneId) {
            if (fullName !== awsHostedZoneId) {
                continue
            }
        // If not attempt to automatch.
        } else if (fullName !== domainPlusDot) {
            fullName = fullName.replace(/\.$/i, '')
            // If the AWS Hosted Zone Name is entirely contained within the domain name provided for cert gen match that zone.
            const zoneNameRegex = new RegExp(fullName)
            if (!zoneNameRegex.test(domainPlusDot)) {
                continue
            }
        }

        zoneId = id.replace(/\/?.*zone.*\//i, '')
        name = fullName
        break
    }

    // If you don't have a matching zone, fail.
    if (!zoneId) {
        console.log('AWS Record Changes failed.\nNo zone id matching domain.')
        cb()
        return
    }

    console.log(`\nWS Hosted Zone Id for ${domain}: ${zoneId}`, '\n')

    // Create TXT record.
    const changeParams = {
        ChangeBatch: {
            Changes: [{
                Action: 'UPSERT',
                ResourceRecordSet: {
                    Name: `_acme-challenge.${domain}`,
                    ResourceRecords: [{
                        Value: `"${keyAuthDigest}"`,
                    }],
                    TTL: ttl,
                    Type: 'TXT',
                },
            }],
            Comment: 'lets encrypt challenge',
        },
        HostedZoneId: zoneId,
    }
    data = await route53.changeResourceRecordSets(changeParams).promise()

    // Begin checking if the change has propigated.
    let {ChangeInfo: {Status: status, Id: changeId}} = data

    let i = 0
    do {
        if (status === PROPIGATED_KEY) {
            console.log(`TXT Placement success. Waiting an additional ${ttlWait} seconds for TTL...\n`)
            await sleep(ttlWait * 1000)
            cb()
            return
        }

        console.log(`Propigation Pending. ${i > 0 ? `${attempts - i} attemtps remaining. ` : ''}Waiting ${retryTime} seconds...`)
        await sleep(retryTime * 1000)

        data = await route53.getChange({Id: changeId}).promise()
        status = data.ChangeInfo.Status

        i += 1
    } while (i < attempts)

    console.log(`AWS Record Changes failed.\nPropigation did not complete in max time of ${maxSleep} seconds.`)
    cb()
}

/**
 * Sleep some milliseconds in async functions
 * @param  {Number} [time=100] Time in Milliseconds to sleep
 * @return {Promise}           A promise to resolve in some milliseconds
 */
async function sleep(time = 100) {
    return new Promise((resolve) => setTimeout(resolve, time))
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
