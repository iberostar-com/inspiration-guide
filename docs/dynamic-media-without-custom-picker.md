# Dynamic Media without the Custom Asset Picker

## Current state

The Custom Asset Picker (`custom-asset-namespace:custom-asset`) has been reverted. Extension Manager could not
reliably connect to the EDS/XWalk pages in our current environment, so all image fields are back to the
standard `reference` component that Universal Editor already supports.

This does not remove Dynamic Media support. It only changes how the image value gets into the field.

## How image selection works now

- Image fields use the OOTB `reference` component (Universal Editor's built-in asset selector).
- The author picks or pastes an asset reference as before.
- If the resulting value is a `/content/dam/...` path, EDS renders it through the standard image pipeline.
- If the resulting value is already an external Dynamic Media delivery URL, EDS detects it and renders a
  responsive `<picture>` using the presets in `scripts/iberostar/image-presets.js`.

## Where detection happens

`scripts/iberostar/dynamic-media.js` exports:

- `isDynamicMediaOpenApiUrl(url)` — `delivery-pXXXX-eYYYY.adobeaemcloud.com` Assets/OpenAPI delivery URLs.
- `isDynamicMediaClassicUrl(url)` — classic Scene7/IS-Image URLs (`/is/image/...`), including GraphQL
  `_dmS7Url` values.
- `isExternalImageUrl(url)` — any other `http(s)` URL.
- `buildDynamicMediaImageUrl(url, options)` — appends safe width/height/quality/format parameters for the
  detected URL type.
- `createDynamicMediaPicture(options)` — builds `<picture>`/`<img>` with srcset per breakpoint.
- `createResponsiveImage(options)` — picks the right rendering strategy for a given image value.

`scripts/iberostar/media.js` (the shared helper most blocks already import) calls into this module, so no
per-block wiring is required for standard blocks.

## Field contract

- `image` / `desktopImage` / `mobileImage` / `backgroundImage`: image reference or URL. Not translated.
- `imageAlt`: translatable alt text.
- `caption` / `imageCaption`: translatable caption text.

## Validating a Dynamic Media delivery URL manually

If you need to point a field at an already-published Dynamic Media asset without the picker:

1. Copy the delivery URL from AEM Assets (`https://delivery-p...adobeaemcloud.com/adobe/assets/...` or a
   classic `.../is/image/...` URL).
2. Paste it into the field value (via the reference field or, where the model exposes a text override, the
   corresponding text field).
3. Preview the page and confirm the image renders and the `<img>`/`<source>` URLs point to the expected host.

## Preview validation checklist

- Image loads with no console errors.
- `<picture>` contains responsive `<source>` entries for Dynamic Media URLs.
- Existing `/media_*` images from EDS's own optimizer keep working unchanged.
- Alt text and captions appear correctly per locale.

## Files kept from the Custom Asset Picker attempt

These files were created for the Custom Asset Picker experiment and are **not deleted**, in case the picker
is reactivated later once Extension Manager connectivity is resolved:

- `tools/assets-selector/image.config.json`
- `docs/dynamic-media-authoring-guide.md`
- `docs/dynamic-media-openapi-setup.md`

They are currently unused by any model. Remove them only when the team confirms the Custom Asset Picker will
not be revisited.
