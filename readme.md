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
    awsAccessKey: 'YOUR_ACCESS_KEY',
    awsSecretKey: 'YOU_SECRET_KEY',
    email: 'YOUR_EMAIL',
    useLive: false,
}
```

#### Note on Hosted Zones:
The script will look for an AWS Hosted Zone with an id matching the supplied domain(s).
If one isn't found it will look for a zone id that is entirely contained within the supplied domain. 

Example:  
This will match.  
zone id: `example.com`  
config domain: `foo.bar.example.com`


#### Note on usage with haproxy
If you're using this utility with haproxy it will want a single file consisting of `fullchain.pem` with `privkey.pem` pasted in afterwards.
