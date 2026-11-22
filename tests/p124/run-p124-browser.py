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
          window.__p124Rules = [];
          window.__p124Component = { classes: [], attributes: {}, getId() { return 'hero-selected'; }, addClass(name) { if (!this.classes.includes(name)) this.classes.push(name); this.className = this.classes.join(' '); }, addAttributes(values) { Object.assign(this.attributes, values); }, is() { return false; } };
          window.CVWeb = {
            addComponents(markup) { window.__p124Inserted.push(markup); return true; },
            getSelected() { return window.__p124Component; },
            Css: { setRule(selector, style, options) { window.__p124Rules.push({ selector, style, options: options || null }); } }
          };
          window.CV = { engines: { web: { save() { window.__p124SaveCount++; return true; } } } };
        }""")
        await page.add_script_tag(path=str(MODULE))
        await page.wait_for_selector("#page-webEngine [data-canvio-p124-panel]")
        panel = page.locator("#page-webEngine [data-canvio-p124-panel]")
        buttons = panel.locator("button[data-p124-kind]")
        assert await buttons.count() == 5, "expected five layout preset controls"
        assert await panel.locator("select[aria-label='Biến thể component'] option").count() == 4
        await panel.locator("select[aria-label='Biến thể component']").select_option("soft")
        for selector, value in [
            ("#cv-p124-title", "Bố cục kiểm thử"),
            ("#cv-p124-gap", "28"),
            ("#cv-p124-break-mobile", "680"),
            ("#cv-p124-break-tablet", "1024"),
            ("#cv-p124-cols-mobile", "1"),
            ("#cv-p124-cols-tablet", "2"),
            ("#cv-p124-cols-desktop", "4")
        ]:
            await panel.locator(selector).fill(value)
        assert await panel.locator("#cv-p124-break-mobile").input_value() == "680"
        await panel.locator("button[data-p124-kind='grid']").click()
        await page.wait_for_function("window.__p124Inserted.length === 1")
        await page.wait_for_function("window.__p124SaveCount === 1")
        first = await page.evaluate("window.__p124Inserted[0]")
        assert 'data-canvio-auto-layout="grid"' in first
        assert 'data-canvio-variant="soft"' in first
        assert "grid-template-columns:repeat(4,minmax(0,1fr))" in first
        assert "@media(max-width:680px)" in first
        assert "@media(max-width:1024px)" in first
        assert "Bố cục kiểm thử" in first
        assert await page.evaluate("window.__p124SaveCount") == 1
        await panel.locator("button[data-p124-apply-selected]").click()
        await page.wait_for_function("window.__p124Rules.length === 3 && window.__p124SaveCount === 2")
        assert await page.evaluate("window.__p124Component.className === 'cv-p124-selected-hero-selected'")
        assert await page.evaluate("window.__p124Rules[1].options.atRuleParams.includes('1024px') && window.__p124Rules[2].options.atRuleParams.includes('680px')")
        await panel.locator("#cv-p124-selected-layout").select_option("grid")
        await panel.locator("button[data-p124-apply-layout]").click()
        await page.wait_for_function("window.__p124Rules.length === 6 && window.__p124SaveCount === 3")
        assert await page.evaluate("window.__p124Component.attributes['data-canvio-auto-layout'] === 'grid'")
        assert await page.evaluate("window.__p124Component.attributes['data-canvio-layout-version'] === '124.4.0'")
        assert await page.evaluate("window.__p124Component.className.includes('cv-p124-selected-hero-selected')")
        await panel.locator("button[data-p124-apply-variant]").click()
        await page.wait_for_function("window.__p124Rules.length === 7 && window.__p124SaveCount === 4")
        assert await page.evaluate("window.__p124Component.attributes['data-canvio-variant'] === 'soft'")
        await panel.locator("input[data-p124-show='tablet']").uncheck()
        await panel.locator("input[data-p124-show='mobile']").uncheck()
        await panel.locator("button[data-p124-apply-visibility]").click()
        await page.wait_for_function("window.__p124Rules.length === 9 && window.__p124SaveCount === 5")
        assert await page.evaluate("window.__p124Component.attributes['data-canvio-hide'] === 'tablet,mobile'")
        assert await page.evaluate("window.__p124Rules[7].style.display === 'none !important' && window.__p124Rules[8].options.atRuleParams === '(max-width: 680px)'")
        await panel.locator("input[data-p124-show='desktop']").uncheck()
        await panel.locator("button[data-p124-apply-visibility]").click()
        await page.wait_for_function("document.querySelector('[data-canvio-p124-panel] [role=status]').textContent.includes('cả ba thiết bị')")
        assert await page.evaluate("window.__p124Component.attributes['data-canvio-hide'] === 'tablet,mobile'")
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
            "passed": 22,
            "total": 22,
            "checks": {
                "panelMountsInCanonicalHost": True,
                "fiveLayoutControls": True,
                "fourComponentVariants": True,
                "gridInsertUsesResponsiveCSS": True,
                "breakpointControlsAcceptUserValues": True,
                "mobileAndTabletMediaQueriesApplied": True,
                "customTitleAndDesktopColumnsApplied": True,
                "variantSelectionApplied": True,
                "visibilityPerBreakpointApplied": True,
                "hidingEverywhereRejected": True,
                "canonicalSaveCalled": True,
                "selectedComponentReceivesResponsiveClass": True,
                "selectedComponentGetsThreeBreakpointRules": True,
                "selectedComponentReceivesNativeGridLayoutMetadata": True,
                "selectedComponentLayoutUsesResponsiveCssRules": True,
                "selectedComponentReceivesReusableVariant": True,
                "selectedComponentSaveCalled": True,
                "saveFailureReported": True,
                "mobileViewportNoOverflow": True,
                "zeroPageErrors": True
            }
        }, ensure_ascii=False, indent=2))
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
