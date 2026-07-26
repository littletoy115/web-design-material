# Cosmeline Thailand — Website Redesign Spec (3D-Enhanced)

> **Purpose:** This document (1) dissects the current https://cosmelinethailand.com/ site and
> (2) specifies a rebuilt version that keeps the same content/structure but adds modern 3D
> and motion design. Hand this file to an AI coding assistant (Claude Code, Cursor, etc.)
> and say: *"Build the site described in this spec."*
>
> **Source of truth:** Section 2–3 = facts fetched from the live site (July 2026).
> Section 4+ = the new design specification.

---

## 1. Project Summary

- **Company:** บริษัท คอสเมด ฟาร์ม่า จำกัด (Cosmed Pharma Co., Ltd.) — importer/distributor
  of aesthetic & health products in Thailand
- **Brand/site name:** COSMELINE (logo styles "COSME" bold + "LINE" regular)
- **Business:** Dermal fillers and aesthetic products — Hyamax®, Rejubeau Stylish Le Ciel Rosy,
  BTXA, Dermaren, Institute BCN, SRS
- **Brand promise (footer copy):** "ความสวยที่ไม่มีที่ติ" (flawless beauty)
- **Audience:** Clinics, physicians, and end customers in the Thai aesthetics market
- **Language:** Thai primary, English product names
- **Goal of redesign:** Same information architecture, elevated to a premium/medical-luxury
  look with 3D product showcases, scroll-driven motion, and interactive elements

## 2. Current Site — Technical Facts

| Item | Value |
|---|---|
| CMS | WordPress + Elementor 3.24.4 |
| Page title | "Cosmed" |
| Hosting/CDN | Cloudflare (email obfuscation via cdn-cgi detected) |
| Media | All sections are static JPG/PNG images in `/wp-content/uploads/` (many text-in-image) |
| Fonts | Google Fonts (font-display: swap) |
| Weaknesses observed | Duplicated sections in DOM (mobile/desktop variants), "READ MORE" buttons that are images linking to `#`, heavy scaled images, no real hero video/3D, NEWS & UPDATES menu links to `#` |

## 3. Current Site — Content Inventory (keep all of this)

### 3.1 Navigation
- ABOUT → `/about-us/`
- PRODUCT (dropdown):
  - Hyamax → `/hyamax/`
  - Rejubeau Stylish Le Ciel Rosy → `/rejubuea/`
  - BTXA → `/sample-page/` *(fix: give it a real slug `/btxa/`)*
  - Dermaren → `/dermaren/`
- CONTACT → `/contact/`
- NEWS & UPDATES → currently `#` *(fix: real page or remove)*

### 3.2 Homepage sections (in order)
1. **Hero** — 4 rotating banner images (CM-Hero-banner-1..4)
2. **Vision banner** — image "CM-วิสัยทัศน์-banner"
3. **PRODUCT FEATURES** — subtitle: "สินค้าตามคุณลักษณะที่ตอบโจทย์นวัตกรรมที่คุณต้องการ"
   - 3 category cards: ลดเลือนริ้วรอย → Rosy | สารเติมเต็ม → Hyamax | ขาวกระจ่างใส → BCN
4. **ALL PRODUCT** — subtitle: "ผลิตภัณฑ์สินค้าทั้งหมด Cosmed Pharma" — 6 product cards (see 3.3)
5. **Before/After gallery** — 3 pairs of before/after images
6. **Authenticity check banner** — "CM-ตรวจสินค้าแท้" (verify genuine product)
7. **ARTICLE** — subtitle: "บทความเกี่ยวกับนวัตกรรมด้านความงาม" — 2 article cards
8. **FAQ** — accordion, 6 questions (see 3.4)
9. **INNOVATION** — subtitle: "นวัตกรรมของสินค้าเรา" + image
10. **Footer** — company blurb, PRODUCTS (INSTITUTE BCN / SRS / BTXA), INFO (About / Contact /
    Privacy Policy), SOCIAL (Instagram / Facebook / YouTube), address + phone

### 3.3 Product cards (exact copy — reuse verbatim)
1. **Hyamax® Plus DEEP** — ฟิลเลอร์เนื้อยืดหยุ่น ช่วยแก้ปัญหาริ้วรอย ร่องลึกได้อย่างเรียบเนียน
   เน้นการเติมเต็มใบหน้าให้อิ่มฟูขึ้น ทำให้ใบหน้าดูอ่อนวัยมากขึ้น
2. **Hyamax® Extra DEEP** — ฟิลเลอร์เนื้อแน่น คงรูปได้ดีที่สุด สามารถแก้ไขปัญหาโครงสร้างใบหน้า
   ปรับรูปหน้า และยกกระชับกรอบหน้าได้อย่างธรรมชาติ คงรูปสวยยาวนาน
3. **Hyamax® Lips** — สำหรับเพิ่มความอิ่มฟูให้ริมฝีปาก เนื้อฟิลเลอร์มีความตั้งทรงสวย ขอบปากชัด
   ยกมุมปาก พร้อมปรับริมฝีปากอมชมพูอย่างเป็นธรรมชาติ
4. **Hyamax® Volumizer** — สารเติมเต็มและฟื้นฟูผิวให้มีวอลุ่มเป็นธรรมชาติ โดยเฉพาะบริเวณแก้ม
   ร่องแก้ม แก้ปัญหาไขมันใต้ผิวที่ลดลง
5. **Hyamax® Plus Fine** — ฟิลเลอร์ฟื้นฟูผิวให้มีวอลลุ่มเป็นธรรมชาติ เหมาะสำหรับหน้าแก้ม ร่องแก้ม
6. **Rejubeau Stylish Le Ciel Rosy** — สารเติมเต็มคอลลาเจน กระตุ้นการสร้างคอลลาเจน ผลิตจาก
   Poly-L-Lactic Acid (PLLA) ย่อยสลายได้เองตามธรรมชาติ

### 3.4 FAQ (reuse verbatim)
1. Cosmed Pharma เป็นบริษัทเกี่ยวกับอะไร? → นำเข้าและจัดจำหน่ายผลิตภัณฑ์สุขภาพและความงาม
2. มีผลิตภัณฑ์อะไรบ้าง? → INSTITUTE BCN, BTXA, DERMALIS, SRS SKIN REJUVENATION SOLUTION
3. แตกต่างจากคู่แข่งอย่างไร? → รับรองคุณภาพ นวัตกรรมแตกต่าง ปลอดภัย ประสิทธิภาพสูง
4. ผลิตภัณฑ์ที่นำเข้าปลอดภัยไหม? → ผู้ผลิตมีมาตรฐาน ผ่านการรับรอง
5. บริการหลังการขาย? → มีบริการหลังการขายและให้คำปรึกษาละเอียด
6. การรับรองคุณภาพ? → อย. และมาตรฐานสากล

### 3.5 Contact / footer data
- Address: 77/7 PRIME BIZ HOME หมู่ 6 ถนนเลียบคลองประปา ต.บ้านใหม่ อ.ปากเกร็ด จ.นนทบุรี 11120
- Phone: +66 (0)95 582 7440
- Instagram: instagram.com/cosmelinethailand — Facebook: facebook.com/share/16efWVYqZj

---

## 4. Redesign Direction

**Art direction:** "Medical luxury" — clean clinical white + soft rose/pink accents
(reference the current TileColor pink family), glass morphism cards, subtle gold detailing,
generous whitespace, premium serif display + clean Thai sans.

### 4.1 Design tokens
```css
:root {
  --color-bg: #FFFFFF;
  --color-bg-soft: #FDF6F7;        /* blush white section bg */
  --color-primary: #E8AEB7;        /* rose */
  --color-primary-deep: #C96F80;   /* deep rose — CTAs, accents */
  --color-ink: #2B2B33;            /* near-black text */
  --color-gold: #C9A96A;           /* thin lines, ® marks, dividers */
  --glass: rgba(255,255,255,0.55) + backdrop-filter: blur(18px);
  --radius-card: 24px;
  --shadow-soft: 0 20px 60px rgba(201,111,128,0.12);
}
```
- Display font (EN): a modern serif (e.g., "Playfair Display" or "Fraunces")
- Thai body font: "IBM Plex Sans Thai" or "Noto Sans Thai" — weight 300/400/600
- Motion language: slow, silky ease (`cubic-bezier(0.22, 1, 0.36, 1)`), 0.6–1.2s durations

### 4.2 Tech stack (target)
- **Framework:** Next.js 14+ (App Router) หรือ Vite + React — static export ได้
- **3D:** Three.js ผ่าน **React Three Fiber (R3F)** + `@react-three/drei`
- **Scroll animation:** GSAP + ScrollTrigger (หรือ Framer Motion + `useScroll`)
- **3D models:** glTF/GLB, Draco-compressed; author in Blender or Spline
  - ถ้าไม่มีคนทำโมเดล: ใช้ **Spline** ปั้น vial/syringe ง่ายๆ แล้ว export GLB ได้
- **Images:** next/image + AVIF/WebP, replace all text-in-image with real HTML text
- **Deploy:** static export → any host/CDN (Cloudflare Pages fits, site already uses CF)

> Fallback option ถ้าต้องอยู่บน WordPress ต่อ: build เป็น static bundle แล้ว embed ผ่าน
> Elementor HTML widget ต่อ section หรือทำเป็น headless (WP เป็น CMS, Next.js เป็น frontend)

---

## 5. Section-by-Section Spec (with 3D)

### 5.1 Hero — 3D product showcase (centerpiece)
Replace the 4 static banners with one full-viewport hero:
- **3D scene (R3F):** a Hyamax filler box + syringe/vial floating center-right,
  slowly auto-rotating (0.15 rad/s), soft studio lighting (drei `<Environment preset="studio">`),
  contact shadow beneath (`<ContactShadows>`)
- **Mouse parallax:** camera lerps ±4° toward cursor position
- **Particles:** 150–300 translucent spheres ("hyaluronic acid molecules") drifting upward,
  additive blending, opacity 0.15–0.35
- **Copy (left):**
  - H1: `COSMELINE` (serif, letter-spacing)
  - Sub: `ความสวยที่ไม่มีที่ติ` + one-line EN: "Premium aesthetic innovations, curated worldwide."
  - CTA buttons: `ดูผลิตภัณฑ์` (scroll to §5.3) / `ติดต่อเรา`
- **Scroll cue:** thin animated line + "scroll" label
- **Fallback:** if WebGL unavailable → static hero render (pre-baked PNG of the 3D scene)

### 5.2 Vision strip
- Keep vision message as real text over a soft gradient, gold divider lines
- Scroll-triggered fade+rise (y: 40 → 0, opacity 0 → 1, stagger 0.08s)

### 5.3 PRODUCT FEATURES — 3 category cards with 3D tilt
- Heading: `PRODUCT FEATURES` / sub: `สินค้าตามคุณลักษณะที่ตอบโจทย์นวัตกรรมที่คุณต้องการ`
- 3 glass-morphism cards: ลดเลือนริ้วรอย (Rosy) / สารเติมเต็ม (Hyamax) / ขาวกระจ่างใส (BCN)
- **3D effect:** CSS `transform: perspective(900px) rotateX/rotateY` following cursor
  (max ±8°), light-sweep highlight following the tilt, product PNG floats above card
  with `translateZ(40px)` for depth
- Mobile: tilt via device orientation OFF by default; use subtle idle float animation instead

### 5.4 ALL PRODUCT — horizontal 3D carousel
- Heading: `ALL PRODUCT` / sub: `ผลิตภัณฑ์สินค้าทั้งหมด Cosmed Pharma`
- 6 product cards (copy from §3.3), displayed as a **coverflow-style carousel**:
  center card scale 1.0, side cards scale 0.85 + rotateY ±25° + blur(1px)
- Each card: product image, name (with ®), 2-line description, `READ MORE` → real product page
- Optional upgrade per card: on hover, swap static PNG for a small R3F `<Canvas>` showing
  the product GLB rotating (lazy-mounted, one canvas at a time to control GPU cost)
- Keyboard + touch swipe accessible; auto-advance every 6s, pause on hover

### 5.5 Before/After — interactive comparison slider
- Replace static image pairs with a **drag slider** component (clip-path reveal):
  drag handle with rose ring, labels `BEFORE` / `AFTER` in gold
- 3 sliders in a row (stack on mobile), scroll-triggered entrance
- Add disclaimer line under section: `ผลลัพธ์ขึ้นอยู่กับแต่ละบุคคล` (results vary by individual)

### 5.6 Authenticity check
- Keep as a highlighted band: icon + `ตรวจสอบสินค้าแท้` + short steps + CTA
- Micro-interaction: verified-checkmark draws itself (SVG stroke animation) on scroll into view

### 5.7 ARTICLE
- 2 article cards (copy from current site), real text not image
- Hover: image zoom 1.05 + card lift; link to real article pages

### 5.8 FAQ
- Accordion (real `<details>`-style a11y), 6 items from §3.4
- Plus/minus icon morphs with rotation; open state has blush background

### 5.9 INNOVATION — scroll-driven 3D moment
- As user scrolls through this section, a 3D vial **pins and rotates 360°** driven by
  scroll progress (GSAP ScrollTrigger `scrub: true` bound to R3F rotation)
- Alongside: 3 innovation bullets fade in sequentially (quality / safety / imported standards)

### 5.10 Footer
- Same 4-column content as current (§3.2 item 10, §3.5), dark ink background,
  rose/gold accents, real mailto + tel links, map link for address

---

## 6. Performance & Quality Requirements

- Lighthouse (mobile): Performance ≥ 80, Accessibility ≥ 95, SEO ≥ 95
- Total JS ≤ 350 KB gzip on first load; Three.js code-split, hero canvas lazy after LCP
- GLB models: ≤ 1.5 MB each (Draco); textures ≤ 1024px, KTX2 if possible
- `prefers-reduced-motion: reduce` → disable parallax/scroll-scrub, keep fades only
- All Thai copy as real HTML text (no text-in-image) — fixes SEO of current site
- One `<Canvas>` mounted at a time where possible; `frameloop="demand"` for idle scenes
- Works on mid-range Android; test WebGL fallback path
- Fix current-site issues: real `/btxa/` slug, working READ MORE links, remove duplicate DOM

## 7. Asset Checklist (to prepare before build)

- [ ] Hyamax box + syringe **3D model** (GLB) — or build in Spline from product photos
- [ ] High-res transparent PNGs of all 6 products (reuse/re-cut from current uploads)
- [ ] Logo SVG (COSME bold + LINE regular)
- [ ] 3 before/after image pairs (already on current site — download from uploads)
- [ ] Brand fonts licensed/loaded (Fraunces or Playfair + IBM Plex Sans Thai)
- [ ] Favicon/OG image set

## 8. Build Phases (suggested order for the AI)

1. **Scaffold:** Next.js + Tailwind + design tokens (§4.1), layout, nav, footer
2. **Static sections:** §5.2, 5.3 (CSS tilt only), 5.4 (carousel), 5.5 slider, 5.7, 5.8, 5.10
3. **3D hero:** R3F scene with placeholder geometry (capsule = vial) → swap GLB later
4. **Scroll choreography:** GSAP ScrollTrigger entrances + §5.9 pinned rotation
5. **Polish:** fallbacks, reduced-motion, image optimization, Lighthouse pass
6. **Content QA:** verify all Thai copy matches §3 verbatim, links resolve

## 9. Acceptance Criteria

- [ ] All content from §3 present and identical in wording
- [ ] Hero shows interactive 3D product with mouse parallax + graceful fallback
- [ ] Product carousel, before/after sliders, FAQ accordion all keyboard-accessible
- [ ] INNOVATION section has scroll-scrubbed 3D rotation
- [ ] Meets performance budgets in §6 on mobile
- [ ] Site reads as premium medical-aesthetic brand, Thai-first