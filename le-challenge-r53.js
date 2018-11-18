/* eslint-disable require-jsdoc, max-params, no-div-regex */
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

    const config = this.getOptions()
    const AWS = require('aws-sdk')
    AWS.config.accessKeyId = config.awsAccessKey
    AWS.config.secretAccessKey = config.awsSecretKey
    const route53 = new AWS.Route53()

    // Get all domains from Route53
    let {HostedZones} = await route53.listHostedZonesByName().promise()
    let zoneId

    // Find the one we are trying to modify
    HostedZones.forEach((zone) => {
        let domainWithDot = domain + '.'
        if (domainWithDot.includes(zone.Name)) {
            zoneId = zone.Id
            console.log(`Found domain on Route53. ${zone.Name} ${zoneId}`)
        }
    })

    if (!zoneId) {
        throw new Error('The requested domain name did not have a matching record set')
    }

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
                    TTL: 60,
                    Type: 'TXT',
                },
            }],
            Comment: 'lets encrypt challenge',
        },
        HostedZoneId: zoneId,
    }
    let {ChangeInfo: {Id: changeId}} = await route53.changeResourceRecordSets(changeParams).promise()
    console.log(`Change request submitted. Id: ${changeId}`)

    // Wait until Route53 reports that the TXT record has been propagated
    await route53.waitFor('resourceRecordSetsChanged', {Id: changeId}).promise()
    cb()
}

// nothing to do here, that's why it's manual
Challenge.get = function(defaults, domain, challenge, cb) {
    cb(null)
}

// might as well tell the user that whatever they were setting up has been checked
Challenge.remove = function(args, domain, challenge, cb) {
    console.info('Challenge for \'' + domain + '\' complete. You may remove it.')
    cb(null)
}
