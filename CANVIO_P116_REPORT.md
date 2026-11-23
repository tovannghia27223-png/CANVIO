### Lô P116 — Nghiệm thu xuất DOCX/PDF thật + sửa lỗi (2026-11-23)
- Quét: tracker ghi "PPTX là ảnh" đã cũ — index có nút "PPTX sửa được" (`CVLot23.pptx`, đối tượng riêng). MP4: đường WebCodecs chỉ video-only, có audio/footage thì dùng MediaRecorder MP4. Không thấy AudioEncoder/mp4-muxer.
- Đã làm: chạy xuất thật từ app trong Chromium (`CVATSExport.exportDocx`, `CANVIOCVPDF.exportCV`, CV tiếng Việt có dấu) rồi mở bằng ứng dụng ngoài.
  - DOCX: python-docx mở được; LibreOffice → PDF A4, chữ Việt đúng. PASS.
  - PDF vector: qpdf --check sạch, A4, font nhúng (CID TrueType, Unicode), pdftotext trích đúng chữ Việt. PASS.
- Lỗi tìm thấy và đã sửa: Title trong Info của PDF bị méo dấu ("Nguyá»…n"). Nay ghi UTF-16BE (`<FEFF…>`) → pdfinfo hiện "CANVIO CV · Nguyễn Thị Ánh Tuyết". Sửa 1 chỗ trong `CANVIOVectorPDF.createPdf`.
- Test: node --check script bị sửa OK; 0 pageerror.
- Chưa kiểm / giới hạn: PPTX sửa được (cần mở bằng PowerPoint/Slides); MP4 H.264 (Chromium kiểm thử không có codec H.264, cần Chrome thật); PDF poster (`%PDF-1.4` ảnh raster) chưa kiểm; font Noto nhúng nguyên bản (~630 KB, không subset); PDF cần `assets/pdf-fonts/NotoSans-Regular.ttf` cạnh index (bản test dùng font OFL từ npm @expo-google-fonts/noto-sans).
- Việc tiếp theo: subset font PDF + kiểm PPTX bằng python-pptx/LibreOffice; MP4 audio cần Chrome thật.

### Lô P116.b — PPTX nghiệm thu + subset font PDF (2026-11-23)
- Quét: nút "PPTX sửa được" (`#cv-pptx2`) đã có; PDF vector nhúng nguyên font Noto (~630 KB, không nén).
- Đã làm: (1) Bấm nút thật trong Chromium trên trang poster mẫu → python-pptx đọc đủ 8 đối tượng (hình, chữ là text box sửa được, ellipse…), chữ Việt đúng, khổ 4:5; LibreOffice → PDF 1 trang, trích chữ đúng. PASS. (2) `CANVIOVectorPDF.createPdf`: thêm `subsetTrueType` (giữ nguyên glyph id nên CIDToGIDMap không đổi; xóa outline glyph không dùng; chỉ giữ cvt/fpgm/glyf/head/hhea/hmtx/loca/maxp/prep) + `deflateBytes` (FlateDecode). Lỗi → tự nhúng font nguyên bản.
- Kết quả: PDF CV 661 KB → 46 KB; qpdf --check sạch; pdftotext đúng; fontTools mở được font con (120 glyph có outline); render pdftoppm: dấu tiếng Việt đúng.
- Test: node --check OK; 0 pageerror; `CANVIOCVPDF.tests()` 15/15, `CVATSExport.tests()` 14/14; `CANVIOVectorPDF.tests()` có 4 cờ false (fontLoaded, vietnameseGlyphCoverage, pdfx, cmyk) — giống hệt bản gốc trước khi sửa (không hồi quy).
- Quan sát (chưa sửa): trong PDF CV mẫu, đường kẻ xanh dưới tên đè lên dòng chức danh — do bố cục `buildPages`, không liên quan font; nên xem lại.
- Chưa kiểm: PPTX trên PowerPoint/Slides thật; MP4 H.264 trên Chrome thật; PDF poster raster; `pdffonts` vẫn hiện "sub no" (tên font chưa có tiền tố subset, vô hại).

### Lô P116.c — Chốt P116 (2026-11-23)
- Sửa: đường kẻ xanh ở trang 1 của PDF CV nay ở y=76 (giữa tên và chức danh) thay vì y=88 đè chữ; trang nối tiếp giữ y=88. Sửa 1 biểu thức trong `makeSvgPage`. Đã xuất lại và xem ảnh render: hết đè.
- Kiểm PDF poster (`#cv-pdf`, PDF 1.4, ảnh JPEG mỗi trang): qpdf --check sạch, 1 trang 330×412,5 pt (4:5), render đúng chữ Việt. PASS (là ảnh raster, chữ không chọn được — đúng mô tả).
- Test: `CANVIOCVPDF.tests()` 15/15, `CVATSExport.tests()` 14/14; `CANVIOVectorPDF.tests()` 4 cờ false như bản gốc (không hồi quy); 0 pageerror.
- P116 đóng ở mức tự kiểm: DOCX, PDF vector (subset), PDF poster raster, PPTX sửa được đều mở được bằng công cụ ngoài. Còn mở (cần Chrome/PowerPoint thật): MP4 H.264 (và audio qua đường MediaRecorder), PPTX trên PowerPoint/Slides.
- Việc tiếp theo: nghiệm thu thiết bị thật khi có môi trường Chrome H.264 và PowerPoint/Slides.
