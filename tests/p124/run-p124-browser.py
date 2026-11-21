#!/usr/bin/env python3
"""P124 real Chromium interaction smoke using the production module and canonical Website Engine adapter contract."""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]
MODULE = ROOT / "canvio-p124-autolayout.js"

async def main():
    errors = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        page = await browser.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.set_content("<!doctype html><html lang='vi'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head><body><main id='page-webEngine'></main></body></html>")
        await page.evaluate("""() => {
          window.__p124Inserted = [];
          window.__p124SaveCount = 0;
          window.CVWeb = { addComponents(markup) { window.__p124Inserted.push(markup); return true; } };
          window.CV = { engines: { web: { save() { window.__p124SaveCount++; return true; } } } };
        }""")
        await page.add_script_tag(path=str(MODULE))
        await page.wait_for_selector("#page-webEngine [data-canvio-p124-panel]")
        panel = page.locator("#page-webEngine [data-canvio-p124-panel]")
        buttons = panel.locator("button[data-p124-kind]")
        assert await buttons.count() == 5, "expected five layout preset controls"
        assert await panel.locator("select[aria-label='Biến thể component'] option").count() == 4
        await panel.locator("select[aria-label='Biến thể component']").select_option("soft")
        await panel.locator("button[data-p124-kind='grid']").click()
        await page.wait_for_function("window.__p124Inserted.length === 1")
        await page.wait_for_function("window.__p124SaveCount === 1")
        first = await page.evaluate("window.__p124Inserted[0]")
        assert 'data-canvio-auto-layout="grid"' in first
        assert 'data-canvio-variant="soft"' in first
        assert "repeat(auto-fit,minmax" in first
        assert await page.evaluate("window.__p124SaveCount") == 1
        await page.evaluate("""() => { window.CV.engines.web.save = () => { window.__p124SaveCount++; return false; }; }""")
        await panel.locator("button[data-p124-kind='card']").click()
        await page.wait_for_function("window.__p124Inserted.length === 2")
        await page.wait_for_function("document.querySelector('[data-canvio-p124-panel] [role=status]').textContent.toLowerCase().includes('từ chối lưu')")
        status = await panel.locator("[role='status']").inner_text()
        assert "từ chối lưu" in status.lower(), status
        assert await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "mobile viewport overflow"
        assert not errors, errors
        print(json.dumps({
            "suite": "P124 Chromium UI interaction",
            "passed": 9,
            "total": 9,
            "checks": {
                "panelMountsInCanonicalHost": True,
                "fiveLayoutControls": True,
                "fourComponentVariants": True,
                "gridInsertUsesResponsiveCSS": True,
                "variantSelectionApplied": True,
                "canonicalSaveCalled": True,
                "saveFailureReported": True,
                "mobileViewportNoOverflow": True,
                "zeroPageErrors": True
            }
        }, ensure_ascii=False, indent=2))
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
