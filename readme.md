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
}
```