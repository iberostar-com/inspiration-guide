# Dynamic Media OpenAPI setup

This project uses the Universal Editor Custom Asset Picker to select approved image assets from AEM Assets delivery repositories. During QA validation, the picker configuration is served from:

`/tools/assets-selector/image.config.json`

The current test branch points its static model `configUrl` values to the Develop host. Before production, switch those model values to the main host after Develop and QA validation succeed.

## Headers configuration

This repository does not contain a versioned `headers.json` managed through Config Service. Configure the following rule in Config Service for each site. Do not use a wildcard origin.

### inspiration-guide

```text
POST https://admin.hlx.page/config/iberostar-com/sites/inspiration-guide/headers.json
```

```json
{
  "/tools/assets-selector/**": [
    {
      "key": "access-control-allow-origin",
      "value": "https://experience.adobe.com"
    },
    {
      "key": "access-control-allow-methods",
      "value": "GET, HEAD, OPTIONS"
    },
    {
      "key": "access-control-allow-headers",
      "value": "content-type"
    }
  ]
}
```

### inspiration-guide-qa

```text
POST https://admin.hlx.page/config/iberostar-com/sites/inspiration-guide-qa/headers.json
```

Use the same JSON body shown above.

### inspiration-guide-dev

```text
POST https://admin.hlx.page/config/iberostar-com/sites/inspiration-guide-dev/headers.json
```

Use the same JSON body shown above.

## CSP

No versioned CSP configuration was found in this repository. If the hosting configuration defines a restrictive `img-src`, allow the approved `delivery-p*.adobeaemcloud.com` origins there. Do not change `cdn.yaml` in this repository.

## Validation

```bash
curl -i "https://develop--inspiration-guide-dev--iberostar-com.aem.page/tools/assets-selector/image.config.json?cache=off"
curl -sD- "https://develop--inspiration-guide-dev--iberostar-com.aem.page/tools/assets-selector/image.config.json?cache=off" -o /dev/null | grep -i "access-control"
```
