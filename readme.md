# Use Greenlock to generate SSL certs via DNS records

### How to Use
- Add an AWS IAM User with the following permissions
  - ChangeResourceRecordSets
  - GetChange
  - ListHostedZones
  - ListHostedZonesByName

- Add the following items to ./config.js
 ```
 module.exports = {
    domains: [
        'example.org',
    ],
    awsKeys: {
        accessKey: 'YOUR_ACCESS_KEY',
        secretKey: 'YOU_SECRET_KEY',
    },
    email: 'YOUR_EMAIL',
    useLive: false,

    // Optional params (probs no need to change these):
    ttl: 60,
    // Time to wait after ttl before continuing to greensock:
    ttlBuffer: 10,
    // Time to wait between checking route 53 propigation:
    retryTime: 20,
    // Maximum length of time to wait for propigation to take place:
    maxSleep: 80,
    // Specific AWS Hosted Zone Id:
    awsHostedZoneId: 'YOUR_AWSHS_ID',
}
```

#### Note on Hosted Zones:
The script will look for an AWS Hosted Zone with an id matching the supplied domain(s). If one isn't found it will look for a zone id that is entirely contained within the supplied domain. 

Example:  
This will match.  
zone id: `example.com`  
config domain: `foo.bar.example.com`

If you want to supply a specific id you can do so with the optional param `awsHostedZoneId`.

