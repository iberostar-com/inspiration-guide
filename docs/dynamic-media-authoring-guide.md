# Dynamic Media authoring guide

## Selecting an image

1. Open the page in Universal Editor.
2. Select an image field in the block.
3. Open the Custom Asset Picker.
4. Choose the `delivery` repository for the target environment when available.
5. Filter by Image and select an approved asset from `/content/dam/iberostar-com`.
6. Save the page and validate it in Preview.

The picker stores the Dynamic Media delivery URL. Do not paste image URLs manually except when the development team explicitly asks for it.

## Alt text and captions

Complete the block's alt text field for every informative image. Keep alt text concise and meaningful. Decorative images may use an empty alt value where the block supports it.

Use the block's caption or credit field for captions and image credits. Do not put captions into the image URL or alt field.

Image URLs are technical asset references and are not translated. Alt text and captions are editorial content and are translated with Trados.

## Approved assets

Use only assets from the approved Iberostar AEM Assets repository under `/content/dam/iberostar-com`. If an asset is updated, expired, unpublished, or removed in AEM Assets, the page may be affected.

## Preview validation

After saving:

- Open the page in Preview.
- Confirm that the image loads.
- Inspect the image element and confirm its URL points to an approved `delivery-p*.adobeaemcloud.com` origin.
- Check that responsive sources load at the expected viewport widths.
- Check the browser console for CORS or CSP errors.

Existing pages with `/media_*` image URLs remain supported through the standard EDS image fallback.

## Troubleshooting

If the picker does not load or does not show repositories:

- confirm that the picker config URL is reachable;
- confirm the `/tools/assets-selector/**` CORS headers are configured in Config Service;
- confirm the selected repository is included in `image.config.json`;
- confirm the asset is under `/content/dam/iberostar-com`;
- report the page path, block name, environment, and browser console error to the development team.
