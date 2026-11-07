import { chromium, webkit } from "@playwright/test";
import assert from "node:assert/strict";
const mode = "after";
const engine = process.argv[2] || "chromium";
const browser = await (engine === "webkit" ? webkit : chromium).launch(
  engine === "chromium"
    ? {
        ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
          : {}),
        args: ["--no-sandbox"],
      }
    : { headless: true },
);
const fixture = {
  settings: {
    username: "ashley",
    hideTotal: false,
    timezone: "America/Caracas",
    currency: "USD",
  },
  periods: [
    {
      id: "period1",
      name: "Primera quincena de noviembre",
      start: "2026-11-01",
      end: "2026-11-15",
      closed: false,
    },
  ],
  sales: [],
};
const findings = [];
try {
  for (const width of [320, 360, 375, 390, 430, 768]) {
    const page = await browser.newPage({
      viewport: { width, height: 844 },
      isMobile: width < 768,
      hasTouch: true,
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() =>
      localStorage.setItem("ashley.auth.v1", "a".repeat(64)),
    );
    await page.route("**/api/**", async (route) => {
      if (route.request().method() !== "GET")
        throw Error("Unexpected mutation");
      await route.fulfill({ json: fixture });
    });
    await page.goto(process.env.MOBILE_TEST_URL || "http://localhost:3002");
    await page.getByRole("heading", { name: "Hola, Ashley" }).waitFor();
    const check = async (name) => {
      const data = await page.evaluate(() => {
        const dialog = document.querySelector("dialog[open]");
        const root = dialog || document.documentElement;
        const fields = [...root.querySelectorAll("input[type=date]")].map(
          (e) => {
            const r = e.getBoundingClientRect(),
              p = e.closest("label").getBoundingClientRect();
            return {
              name: e.name || e.getAttribute("aria-label"),
              x: r.x,
              y: r.y,
              width: r.width,
              right: r.right,
              labelRight: p.right,
              labelWidth: p.width,
              font: getComputedStyle(e).fontSize,
              scroll: e.scrollWidth,
              client: e.clientWidth,
            };
          },
        );
        return { overflow: root.scrollWidth > root.clientWidth + 1, fields };
      });
      const problems = data.fields.filter(
        (f) => f.right > f.labelRight + 1 || f.scroll > f.client + 2,
      );
      findings.push({ engine, width, name, ...data, problems });
      if (mode === "after") {
        assert.equal(
          data.overflow,
          false,
          JSON.stringify({ engine, width, name, ...data }),
        );
        assert.equal(problems.length, 0, JSON.stringify(problems));
        for (const field of data.fields)
          assert.ok(
            field.width >= 160,
            `Date field too narrow (${field.width}px) at ${width}px in ${name}`,
          );
      }
    };
    await page.getByRole("button", { name: "Ventas", exact: true }).click();
    await check("sales");
    if (width === 390)
      await page.screenshot({
        path: `/tmp/ashley-${mode}-${engine}-sales.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Quincenas", exact: true }).click();
    await page
      .getByRole("button", { name: "Nueva quincena", exact: true })
      .click();
    await check("periods");
    if (width === 390)
      await page.screenshot({
        path: `/tmp/ashley-${mode}-${engine}-periods.png`,
      });
    if (mode === "after") {
      await page.getByLabel("Inicio", { exact: true }).fill("2026-11-16");
      await page.getByLabel("Fin", { exact: true }).fill("2026-11-30");
      assert.equal(
        await page.getByLabel("Inicio", { exact: true }).inputValue(),
        "2026-11-16",
      );
      assert.equal(
        await page.getByLabel("Fin", { exact: true }).inputValue(),
        "2026-11-30",
      );
      const save = page.getByRole("button", {
        name: "Guardar quincena",
        exact: true,
      });
      await save.scrollIntoViewIfNeeded();
      assert.equal(await save.isVisible(), true);
    }
    await page.getByRole("button", { name: "Cerrar ventana" }).click();
    await page
      .getByRole("button", { name: "Agregar venta", exact: true })
      .click();
    await check("sale form");
    if (width === 390)
      await page.screenshot({ path: `/tmp/ashley-${mode}-${engine}-form.png` });
    await page.getByRole("button", { name: "Cerrar ventana" }).click();
    await page.getByRole("button", { name: "Ajustes", exact: true }).click();
    await check("settings");
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    `PASS ${engine}: ${findings.length} layout checks at 320, 360, 375, 390, 430 and 768px; date inputs editable, no overflow or page errors.`,
  );
} finally {
  await browser.close();
}
