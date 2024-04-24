<p align="center">
  <img src="https://helloextend-static-assets.s3.amazonaws.com/extend-shield-logo.png" />
  <h1 align="center">Extend - Salesforce Commerce Cloud</h1>
</p>

## The latest version
The latest version of this cartridge is v2024_04


## Company Overview
Extend provides an easy way for any merchant to offer extended protection plans, generating new revenue, increasing purchase conversion, and dramatically improving the customer experience. 

## Integration Overview
This repository contains the Extend integrations with the Salesforce Commerce Cloud platform. There are two versions currently available for SiteGenesis Javascript Controller (SGJS) and Salesforce Reference Architecture (SFRA). 

### Feature List

### Cartridges
* `int_extend` - Includes SG Controllers specific logic
* `int_extend_sfra` - Includes SFRA specific logic

### SiteGenesis Javascript Controller (SGJC)
For the manual, please see the `Extend Sitegenesis Integration Guide` file in the `documentation` directory.

### Salesforce Reference Architecture (SFRA)
For the manual, please see the `Extend SFRA Integration Guide` file in the `documentation` directory.

## NPM scripts
`npm install` - Install all of the local dependencies.
`npm run compile:scss` - Compiles all .scss files and aggregates them.
`npm run compile:js` - Compiles all .js files and aggregates them.
`npm run lint` - Execute linting for all CSS & JavaScript files in the project.
`npm run uploadCartridge` - Will upload `int_extend` and `int_extend_sfra`to the server. Requires a valid `dw.json` file at the root that is configured for the sandbox to upload.

## Tests
### Unit tests
In order to run the unit tests, do the following steps in the root of the project.
1. `npm install`
2. `npm run test`

### Integration tests
<!-- In order to run the integration tests, do the following steps in the root of the project.
1. `npm install`
2. Make sure you have a `dw.json` file pointing to a sandbox.
3. Change `baseUrl` in `it.config.js` if necessary.
4. `npm run test:integration`

Sample `dw.json` file
```json
{
    "hostname": "your-sandbox-hostname.demandware.net",
    "username": "yourlogin",
    "password": "yourpwd",
    "code-version": "version_to_upload_to"
}
``` -->

## Support

- General Questions: [hello@extend.com](hello@extend.com)

- Integration Questions: [integrations@extend.com](integrations@extend.com)
