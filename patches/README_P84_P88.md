# CANVIO P84/P88 delivery patch notes

- `canvio-p70-to-p84-index.patch` is an **index.html-only unified diff** from the `index.html` contained in `CANVIO_PHASES_1_6_P70_DELIVERY.zip` to the current local candidate `23.3.89-p84`.
- The full deliverable ZIP is authoritative. It contains the complete source, standalone synchronized modules, test harnesses/reports, workflow, docs, assets and historical backups.
- The P84 UI routing uses the existing `CVLot22.pdf()` exporter. The output remains raster/image-backed; no vector text, font embedding/outlining, PDF/X or CMYK certification is claimed.
- P88 validates the existing `CVLot23.pptx(gen)` serializer structurally (14/14 synthetic OOXML smoke checks). It is not PowerPoint/Keynote/Google Slides open-edit-save-reopen acceptance.
- P70's release gate remains fail-closed with fourteen real-world gates OPEN. No GitHub commit, PR, merge or deployment is included.
