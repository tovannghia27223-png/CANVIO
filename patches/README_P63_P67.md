# P63–P67 source patch

`canvio-p62-to-p67.patch` updates the P62 application entrypoint to the P67 integrated entrypoint. The implementation module is also provided as `../canvio-p63-p67.js` and is embedded inline in `index.html` under `canvio-p63-p67-main`.

Apply from the package root to a clean P62 tree:

```bash
patch -p1 < patches/canvio-p62-to-p67.patch
node tests/p63-p67/verify-p63-p67-source.cjs
```

The test verifies that the standalone module exactly matches the inline application module.
