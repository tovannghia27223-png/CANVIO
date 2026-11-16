# P68–P70 source patch

`canvio-p67-to-p70.patch` applies the final milestone to a clean P67 source tree. It includes the P68–P70 application integration, synchronized standalone module, tests, reports, documentation and CI updates. The delivery manifest is regenerated separately after the final package is assembled.

Apply from the package root to a clean P67 tree:

```bash
patch -p1 < patches/canvio-p67-to-p70.patch
node tests/p68-p70/verify-p68-p70-source.cjs
node tests/p68-p70/run-p68-p70-tests.cjs
```

The generated patch is intended for review and source reconstruction. Runtime/real-world acceptance limitations remain listed in `CANVIO_QA_REPORT.md`; this patch does not make the candidate production-certified.
