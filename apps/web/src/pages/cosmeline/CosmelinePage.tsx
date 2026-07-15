// @ts-nocheck
import { Suspense, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import HeroScene3D from './HeroScene3D';
import InnovationScene from './InnovationScene';

/* ── Design tokens ── */
const T = {
  bg: '#FFFFFF',
  bgSoft: '#FDF6F7',
  primary: '#E8AEB7',
  deep: '#C96F80',
  ink: '#2B2B33',
  gold: '#C9A96A',
  glass: 'rgba(255,255,255,0.55)',
};

/* ── FadeIn ── */
function FadeIn({ children, delay = 0, dir = 'up' }: {
  children: React.ReactNode; delay?: number; dir?: 'up' | 'left' | 'right';
}) {
  const [v, setV] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const tx = dir === 'left' ? '-40px' : dir === 'right' ? '40px' : '0px';
  const ty = dir === 'up' ? '40px' : '0px';
  return (
    <div ref={ref} style={{
      transition: `opacity 0.85s ease ${delay}s, transform 0.85s ease ${delay}s`,
      opacity: v ? 1 : 0,
      transform: v ? 'translate(0,0)' : `translate(${tx},${ty})`,
    }}>
      {children}
    </div>
  );
}

/* ── useTilt hook ── */
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    el.style.transform = `perspective(900px) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg)`;
    el.style.transition = 'transform 0.1s ease';
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    el.style.transition = 'transform 0.4s ease';
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}

/* ── Comparison Slider ── */
function ComparisonSlider({ label }: { label: string }) {
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePos = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPos(p);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId); updatePos(e.clientX); }}
      onPointerMove={(e) => { if (dragging.current) updatePos(e.clientX); }}
      onPointerUp={() => { dragging.current = false; }}
      style={{ position: 'relative', width: '100%', height: 320, borderRadius: 16, overflow: 'hidden', cursor: 'col-resize', userSelect: 'none', flex: '1 1 280px' }}
    >
      {/* BEFORE */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #d4a0a8, #b07080)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.2em' }}>BEFORE</span>
      </div>
      {/* AFTER */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #E8AEB7, #f5d0d8)', clipPath: `inset(0 ${100 - pos}% 0 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.2em' }}>AFTER</span>
      </div>
      {/* Labels */}
      <span style={{ position: 'absolute', top: 12, left: 12, color: T.gold, fontSize: '0.7rem', letterSpacing: '0.15em', fontWeight: 600 }}>BEFORE</span>
      <span style={{ position: 'absolute', top: 12, right: 12, color: T.gold, fontSize: '0.7rem', letterSpacing: '0.15em', fontWeight: 600 }}>AFTER</span>
      {/* Handle */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ width: 2, height: '100%', background: T.deep, position: 'absolute' }} />
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', border: `2px solid ${T.deep}`, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: T.deep, fontSize: '0.6rem', lineHeight: 1 }}>◄►</span>
        </div>
      </div>
      {/* Label */}
      <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>{label}</div>
    </div>
  );
}

/* ── Accordion item ── */
function AccordionItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: `1px solid rgba(232,174,183,0.3)` }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: '1rem', color: T.ink, fontWeight: 500 }}>{q}</span>
        <span style={{ color: T.deep, fontSize: '1.4rem', lineHeight: 1, transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', flexShrink: 0, marginLeft: '1rem' }}>+</span>
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? 300 : 0, opacity: open ? 1 : 0, transition: 'max-height 0.35s ease, opacity 0.3s ease', background: open ? T.bgSoft : 'transparent', borderRadius: 8, padding: open ? '1rem 1.2rem' : '0 1.2rem' }}>
        <p style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", color: '#666', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

/* ── PRODUCTS DATA ── */
const PRODUCTS = [
  {
    emoji: '✨',
    name: 'Rejubeau Stylish Le Ciel Rosy',
    label: 'ลดเลือนริ้วรอย',
    desc: 'เซรั่มบำรุงผิวสูตร Multi-Active ลดเลือนริ้วรอยลึก ฟื้นบำรุงผิวให้เรียบเนียน',
  },
  {
    emoji: '💉',
    name: 'Hyamax®',
    label: 'สารเติมเต็ม (Filler)',
    desc: 'Hyaluronic Acid Filler คุณภาพสูง ได้รับการรับรองมาตรฐานยุโรป CE Mark',
  },
  {
    emoji: '🌿',
    name: 'Institute BCN',
    label: 'ขาวกระจ่างใส',
    desc: 'Mesotherapy cocktails สูตรพิเศษจากสเปน เพื่อผิวกระจ่างใสและชุ่มชื้น',
  },
  {
    emoji: '💊',
    name: 'SRS (Skin Rejuvenation Serum)',
    label: 'ฟื้นฟูผิว',
    desc: 'เซรั่มเข้มข้นที่ผสมผสาน Growth Factor และ Peptide ชั้นนำเพื่อฟื้นบำรุงผิว',
  },
  {
    emoji: '⚗️',
    name: 'BTXA Botulinum Toxin Type A',
    label: 'ลดกล้ามเนื้อ',
    desc: 'โบทูลินัมท็อกซินชนิด A บริสุทธิ์ สำหรับลดรอยย่น กล้ามเนื้อ และปรับรูปหน้า',
  },
  {
    emoji: '💧',
    name: 'Dermaren',
    label: 'เติมความชุ่มชื้น',
    desc: 'ไฮยาลูโรนิก แอซิด เกรดพรีเมียม เพื่อเติมความชุ่มชื้นให้ผิวจากระดับลึก',
  },
];

const FAQ_ITEMS = [
  { q: 'Hyamax® คืออะไร?', a: 'Hyamax® คือผลิตภัณฑ์ฟิลเลอร์ Hyaluronic Acid คุณภาพสูงจากประเทศจีน ผ่านการรับรองมาตรฐาน CE Mark จากยุโรป และได้รับการอนุมัติจาก FDA ไทย เหมาะสำหรับการเติมเต็มริ้วรอยและปรับรูปหน้า' },
  { q: 'ผลิตภัณฑ์ปลอดภัยและผ่านการรับรองจาก อย. หรือไม่?', a: 'ใช่ ผลิตภัณฑ์ทุกชนิดที่นำเข้าโดย Cosmeline Thailand ผ่านการรับรองจากสำนักงานคณะกรรมการอาหารและยา (อย.) ของประเทศไทย และมาตรฐานสากลที่เกี่ยวข้อง' },
  { q: 'สั่งซื้อผลิตภัณฑ์ได้ที่ไหน?', a: 'สามารถสั่งซื้อได้โดยตรงผ่านทีมขายของ Cosmeline Thailand ติดต่อได้ทางโทรศัพท์ อีเมล หรือ LINE Official Account โดยผลิตภัณฑ์จำหน่ายเฉพาะแพทย์และคลินิกที่ได้รับอนุญาตเท่านั้น' },
  { q: 'ระยะเวลาผลลัพธ์ของฟิลเลอร์อยู่ได้นานแค่ไหน?', a: 'โดยทั่วไปฟิลเลอร์ Hyamax® มีอายุ 12-18 เดือน ขึ้นอยู่กับบริเวณที่ฉีด ปริมาณที่ใช้ และการตอบสนองของร่างกายแต่ละบุคคล' },
  { q: 'มีการรับประกันสินค้าแท้อย่างไร?', a: 'สินค้าทุกชิ้นมาพร้อมกับ QR Code ตรวจสอบความแท้ที่สามารถสแกนตรวจสอบได้ผ่านระบบออนไลน์ของเรา นอกจากนี้ยังมี Serial Number และ Hologram สติ๊กเกอร์กันปลอม' },
  { q: 'Cosmeline Thailand ต่างจากผู้นำเข้ารายอื่นอย่างไร?', a: 'เราเป็นผู้นำเข้าโดยตรงจากผู้ผลิต ทำให้สามารถรับประกันความแท้ ราคาที่ยุติธรรม และบริการหลังการขายที่ครบวงจร รวมถึงการฝึกอบรมและสนับสนุนทางวิชาการแก่แพทย์ผู้ใช้งาน' },
];

/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════ */
export default function CosmelinePage() {
  const [navShadow, setNavShadow] = useState(false);
  const [productDropdown, setProductDropdown] = useState(false);
  const [activeProduct, setActiveProduct] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const innovationRef = useRef<HTMLDivElement>(null);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [carouselHovered, setCarouselHovered] = useState(false);

  /* Font loading */
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=IBM+Plex+Sans+Thai:wght@300;400;600&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  /* Navbar scroll shadow */
  useEffect(() => {
    const onScroll = () => setNavShadow(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Innovation scroll progress */
  useEffect(() => {
    const onScroll = () => {
      const el = innovationRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)));
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Carousel auto-advance */
  useEffect(() => {
    if (carouselHovered) return;
    carouselTimerRef.current = setInterval(() => {
      setActiveProduct(p => (p + 1) % PRODUCTS.length);
    }, 6000);
    return () => { if (carouselTimerRef.current) clearInterval(carouselTimerRef.current); };
  }, [carouselHovered]);

  /* Feature card tilts */
  const tilt1 = useTilt();
  const tilt2 = useTilt();
  const tilt3 = useTilt();
  const tilts = [tilt1, tilt2, tilt3];

  /* ── STYLES ── */
  const navStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 3rem', height: 64,
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: navShadow ? '0 2px 24px rgba(201,111,128,0.1)' : 'none',
    transition: 'box-shadow 0.3s ease',
  };

  const featureCards = [
    { ...tilts[0], icon: '✨', label: 'ลดเลือนริ้วรอย', name: 'Rejubeau Stylish\nLe Ciel Rosy', desc: 'สูตร Multi-Active ลดเลือนริ้วรอยลึก ฟื้นบำรุงผิวให้เรียบเนียนอย่างเป็นธรรมชาติ' },
    { ...tilts[1], icon: '💉', label: 'สารเติมเต็ม', name: 'Hyamax®', desc: 'Hyaluronic Acid Filler คุณภาพสูง CE Mark ยุโรป ปลอดภัย เห็นผลทันที' },
    { ...tilts[2], icon: '🌿', label: 'ขาวกระจ่างใส', name: 'Institute BCN', desc: 'Mesotherapy cocktails สูตรพิเศษจากสเปน เพื่อผิวกระจ่างใสและชุ่มชื้น' },
  ];

  return (
    <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", background: T.bg, color: T.ink, overflowX: 'hidden' }}>

      {/* ══════════ NAVBAR ══════════ */}
      <nav style={navStyle}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: T.deep, letterSpacing: '0.05em', cursor: 'pointer' }}>
          <span style={{ fontWeight: 700 }}>COSME</span><span style={{ fontWeight: 300 }}>LINE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {['ABOUT', 'CONTACT', 'NEWS'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ color: T.ink, textDecoration: 'none', fontSize: '0.82rem', letterSpacing: '0.12em', fontWeight: 500, transition: 'color 0.2s', ':hover': { color: T.deep } }}
              onMouseEnter={e => (e.currentTarget.style.color = T.deep)}
              onMouseLeave={e => (e.currentTarget.style.color = T.ink)}
            >{item}</a>
          ))}
          {/* Product dropdown */}
          <div style={{ position: 'relative' }}
            onMouseEnter={() => setProductDropdown(true)}
            onMouseLeave={() => setProductDropdown(false)}
          >
            <span style={{ color: T.ink, fontSize: '0.82rem', letterSpacing: '0.12em', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              PRODUCT <span style={{ fontSize: '0.6rem', transform: productDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
            </span>
            {productDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '0.75rem 0', minWidth: 220, zIndex: 200, marginTop: 8 }}>
                {['Hyamax®', 'Institute BCN', 'SRS', 'Rejubeau Stylish Le Ciel Rosy'].map(p => (
                  <div key={p} style={{ padding: '0.55rem 1.4rem', cursor: 'pointer', fontSize: '0.85rem', color: T.ink, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.bgSoft)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >{p}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button style={{ background: T.deep, color: '#fff', border: 'none', borderRadius: 24, padding: '0.5rem 1.4rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 500, transition: 'background 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#b85f70')}
          onMouseLeave={e => (e.currentTarget.style.background = T.deep)}
        >ติดต่อเรา</button>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section style={{ height: '100vh', position: 'relative', background: T.bg }}>
        {/* 3D Canvas */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Suspense fallback={null}>
              <HeroScene3D />
            </Suspense>
          </Canvas>
        </div>
        {/* Gradient overlay left */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0.3) 55%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Text overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5rem 3.5rem', zIndex: 2 }}>
          <FadeIn delay={0}>
            <div style={{ color: T.gold, letterSpacing: '0.3em', fontSize: '0.72rem', fontWeight: 600, marginBottom: '1.2rem', textTransform: 'uppercase' }}>COSMELINE THAILAND</div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(3rem, 5vw, 5rem)', color: T.ink, lineHeight: 1.05, margin: '0 0 0.5rem', fontWeight: 900 }}>COSMELINE</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: '1.3rem', color: T.deep, fontWeight: 600, marginBottom: '0.75rem' }}>ความสวยที่ไม่มีที่ติ</div>
            <div style={{ color: '#888', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 380, marginBottom: '2rem' }}>Premium aesthetic innovations, curated worldwide.</div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button style={{ background: T.deep, color: '#fff', border: 'none', borderRadius: 28, padding: '0.8rem 2rem', fontSize: '0.92rem', cursor: 'pointer', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 600, transition: 'all 0.2s', boxShadow: `0 4px 20px rgba(201,111,128,0.35)` }}
                onMouseEnter={e => { e.currentTarget.style.background = '#b85f70'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.deep; e.currentTarget.style.transform = 'translateY(0)'; }}
              >ดูผลิตภัณฑ์</button>
              <button style={{ background: 'transparent', color: T.deep, border: `2px solid ${T.deep}`, borderRadius: 28, padding: '0.8rem 2rem', fontSize: '0.92rem', cursor: 'pointer', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = T.deep; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.deep; }}
              >ติดต่อเรา</button>
            </div>
          </FadeIn>
        </div>

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 2 }}>
          <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, transparent, ${T.deep})` }} />
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.25em', color: '#aaa', fontWeight: 500 }}>SCROLL</span>
        </div>
      </section>

      {/* ══════════ VISION STRIP ══════════ */}
      <section style={{ padding: '5rem 2rem', background: T.bgSoft }}>
        <div style={{ width: '100%', height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)`, marginBottom: '3.5rem' }} />
        <FadeIn>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: T.ink, marginBottom: '1.5rem', fontWeight: 700 }}>วิสัยทัศน์ของเรา</h2>
            <p style={{ color: '#666', fontSize: '1.05rem', lineHeight: 1.9, fontWeight: 300 }}>
              มุ่งมั่นนำเข้าและจัดจำหน่ายผลิตภัณฑ์สุขภาพและความงามชั้นนำจากทั่วโลก เพื่อมอบนวัตกรรมความงามที่ปลอดภัย มีประสิทธิภาพ และได้มาตรฐานสากล แก่คลินิกและผู้บริโภคชาวไทย
            </p>
          </div>
        </FadeIn>
        <div style={{ width: '100%', height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)`, marginTop: '3.5rem' }} />
      </section>

      {/* ══════════ PRODUCT FEATURES ══════════ */}
      <section style={{ padding: '6rem 2rem', background: T.bg }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: T.ink, marginBottom: '0.75rem', letterSpacing: '0.04em' }}>PRODUCT FEATURES</h2>
            <p style={{ color: '#888', fontSize: '0.95rem' }}>สินค้าตามคุณลักษณะที่ตอบโจทย์นวัตกรรมที่คุณต้องการ</p>
          </div>
        </FadeIn>
        <div style={{ display: 'flex', gap: '1.5rem', maxWidth: 1100, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          {featureCards.map((card, i) => (
            <FadeIn key={i} delay={i * 0.12} dir={i === 0 ? 'left' : i === 2 ? 'right' : 'up'}>
              <div
                ref={card.ref}
                onMouseMove={card.onMouseMove}
                onMouseLeave={card.onMouseLeave}
                style={{
                  flex: '1 1 300px', maxWidth: 340,
                  border: '1px solid rgba(232,174,183,0.3)',
                  borderRadius: 24, padding: '2.5rem',
                  background: T.glass,
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  boxShadow: '0 20px 60px rgba(201,111,128,0.12)',
                  willChange: 'transform',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1.2rem' }}>{card.icon}</div>
                <div style={{ color: T.gold, fontSize: '0.7rem', letterSpacing: '0.18em', fontVariant: 'small-caps', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>{card.label}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: T.deep, fontSize: '1.25rem', lineHeight: 1.3, marginBottom: '0.9rem', whiteSpace: 'pre-line' }}>{card.name}</h3>
                <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>{card.desc}</p>
                <a href="#" style={{ color: T.deep, fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', borderBottom: `1px solid ${T.primary}` }}>ดูเพิ่มเติม →</a>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══════════ ALL PRODUCT CAROUSEL ══════════ */}
      <section style={{ padding: '6rem 2rem', background: T.bgSoft, overflow: 'hidden' }}
        onMouseEnter={() => setCarouselHovered(true)}
        onMouseLeave={() => setCarouselHovered(false)}
      >
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: T.ink, marginBottom: '0.6rem' }}>ALL PRODUCT</h2>
            <p style={{ color: '#888', fontSize: '0.92rem' }}>ผลิตภัณฑ์ทั้งหมดของเรา คัดสรรจากแบรนด์ชั้นนำระดับโลก</p>
          </div>
        </FadeIn>

        <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto' }}>
          {/* Cards track */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', padding: '2rem 0', minHeight: 380 }}>
            {PRODUCTS.map((p, i) => {
              const diff = i - activeProduct;
              const absDiff = Math.abs(diff);
              const scale = absDiff === 0 ? 1 : absDiff === 1 ? 0.85 : 0.72;
              const opacity = absDiff === 0 ? 1 : absDiff === 1 ? 0.7 : 0.45;
              const rotateY = diff < 0 ? `${Math.min(absDiff * 15, 30)}deg` : diff > 0 ? `-${Math.min(absDiff * 15, 30)}deg` : '0deg';
              const zIndex = absDiff === 0 ? 10 : absDiff === 1 ? 5 : 1;
              const display = absDiff <= 2 ? 'flex' : 'none';
              return (
                <div
                  key={i}
                  onClick={() => setActiveProduct(i)}
                  style={{
                    display,
                    flexDirection: 'column',
                    minWidth: 280,
                    maxWidth: 280,
                    background: '#fff',
                    borderRadius: 20,
                    padding: '1.5rem',
                    boxShadow: absDiff === 0 ? '0 16px 48px rgba(201,111,128,0.2)' : '0 4px 16px rgba(0,0,0,0.08)',
                    transform: `perspective(1200px) rotateY(${rotateY}) scale(${scale})`,
                    opacity,
                    zIndex,
                    transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    cursor: absDiff !== 0 ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ height: 180, background: T.bgSoft, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', fontSize: '3.5rem' }}>
                    {p.emoji}
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: T.ink, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {p.name.replace('®', '')}
                    {p.name.includes('®') && <sup style={{ fontSize: '0.6em' }}>®</sup>}
                  </h3>
                  <div style={{ color: T.gold, fontSize: '0.72rem', letterSpacing: '0.12em', fontWeight: 600, marginBottom: '0.6rem', textTransform: 'uppercase' }}>{p.label}</div>
                  <p style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.6, flex: 1, marginBottom: '1rem' }}>{p.desc}</p>
                  <a href="#" style={{ color: T.deep, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.05em' }}>READ MORE →</a>
                </div>
              );
            })}
          </div>

          {/* Prev/Next */}
          {[{ dir: -1, label: '←' }, { dir: 1, label: '→' }].map(({ dir, label }) => (
            <button
              key={dir}
              onClick={() => setActiveProduct(p => (p + dir + PRODUCTS.length) % PRODUCTS.length)}
              style={{
                position: 'absolute',
                top: '50%',
                [dir === -1 ? 'left' : 'right']: '-2.5rem',
                transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                background: 'transparent',
                border: `2px solid ${T.primary}`,
                color: T.deep, fontSize: '1.2rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.primary; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >{label}</button>
          ))}

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            {PRODUCTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveProduct(i)}
                style={{ width: i === activeProduct ? 24 : 8, height: 8, borderRadius: 4, border: 'none', background: i === activeProduct ? T.deep : T.primary, cursor: 'pointer', transition: 'all 0.3s', padding: 0 }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ BEFORE / AFTER ══════════ */}
      <section style={{ padding: '6rem 2rem', background: T.bg }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: T.ink, marginBottom: '0.6rem' }}>ผลลัพธ์ที่เห็นได้ชัด</h2>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>เลื่อนแถบเพื่อเปรียบเทียบก่อน-หลังการใช้ผลิตภัณฑ์</p>
          </div>
        </FadeIn>
        <div style={{ display: 'flex', gap: '1.5rem', maxWidth: 1000, margin: '0 auto', flexWrap: 'wrap' }}>
          <ComparisonSlider label="ผิวหน้า — Hyamax® Filler" />
          <ComparisonSlider label="ริ้วรอย — Rejubeau Series" />
          <ComparisonSlider label="ผิวกระจ่าง — Institute BCN" />
        </div>
        <p style={{ textAlign: 'center', color: T.gold, fontStyle: 'italic', fontSize: '0.82rem', marginTop: '1.5rem' }}>* ผลลัพธ์ขึ้นอยู่กับแต่ละบุคคล</p>
      </section>

      {/* ══════════ AUTHENTICITY CHECK ══════════ */}
      <section id="about" style={{ padding: '5rem 2rem', background: T.ink, color: '#fff' }}>
        <FadeIn>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <AuthCheckMark />
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: '#fff', marginBottom: '2.5rem' }}>ตรวจสอบสินค้าแท้</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
              {['สแกน QR', 'ตรวจสอบ Serial', 'ยืนยันของแท้'].map((step, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${T.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gold, fontWeight: 700, fontSize: '1.1rem', margin: '0 auto 0.75rem' }}>{i + 1}</div>
                  <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>{step}</span>
                </div>
              ))}
            </div>
            <button style={{ background: 'transparent', color: T.gold, border: `2px solid ${T.gold}`, borderRadius: 28, padding: '0.75rem 2.2rem', fontSize: '0.92rem', cursor: 'pointer', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 600, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = T.ink; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.gold; }}
            >ตรวจสอบเลย</button>
          </div>
        </FadeIn>
      </section>

      {/* ══════════ ARTICLE ══════════ */}
      <section style={{ padding: '6rem 2rem', background: T.bgSoft }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: T.ink, marginBottom: '0.6rem' }}>ARTICLE</h2>
            <p style={{ color: '#888', fontSize: '0.92rem' }}>บทความและข้อมูลความรู้จากทีมผู้เชี่ยวชาญ</p>
          </div>
        </FadeIn>
        <div style={{ display: 'flex', gap: '1.5rem', maxWidth: 900, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { title: 'ฟิลเลอร์คืออะไร? ทุกอย่างที่คุณต้องรู้ก่อนทำ', excerpt: 'ฟิลเลอร์คือสารที่ฉีดเข้าใต้ผิวหนังเพื่อเติมเต็มริ้วรอย ปรับโครงหน้า และเพิ่มความอิ่มเอิบให้ผิว...', date: '15 ม.ค. 2567', grad: 'linear-gradient(135deg, #d4a0a8, #C96F80)' },
            { title: 'Hyamax® vs ฟิลเลอร์ทั่วไป: อะไรดีกว่ากัน?', excerpt: 'เปรียบเทียบคุณสมบัติของ Hyamax® กับฟิลเลอร์ยี่ห้ออื่นในตลาด ทั้งด้านความปลอดภัย ความคงทน และราคา...', date: '28 ม.ค. 2567', grad: 'linear-gradient(135deg, #E8AEB7, #c97888)' },
          ].map((art, i) => (
            <ArticleCard key={i} {...art} />
          ))}
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section id="contact" style={{ padding: '6rem 2rem', background: T.bg }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <FadeIn>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: T.ink, textAlign: 'center', marginBottom: '3rem' }}>คำถามที่พบบ่อย</h2>
          </FadeIn>
          {FAQ_ITEMS.map((item, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <AccordionItem
                q={item.q}
                a={item.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══════════ INNOVATION ══════════ */}
      <section ref={innovationRef} style={{ minHeight: '100vh', background: T.bgSoft, display: 'flex', alignItems: 'center', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '4rem', flexWrap: 'wrap', width: '100%' }}>
          {/* Left text */}
          <div style={{ flex: '1 1 320px' }}>
            <FadeIn>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: T.ink, marginBottom: '2rem' }}>นวัตกรรมของสินค้าเรา</h2>
            </FadeIn>
            {[
              '✓ คุณภาพได้มาตรฐานสากล',
              '✓ ปลอดภัย ผ่านการรับรอง อย.',
              '✓ นำเข้าตรงจากผู้ผลิตชั้นนำ',
            ].map((pt, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.15} dir="left">
                <div style={{ padding: '1rem 0', borderBottom: `1px solid rgba(232,174,183,0.2)`, color: T.ink, fontSize: '1.05rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: T.deep, fontWeight: 700 }}>{pt.split(' ')[0]}</span>
                  <span>{pt.split(' ').slice(1).join(' ')}</span>
                </div>
              </FadeIn>
            ))}
          </div>
          {/* Right 3D canvas */}
          <div style={{ flex: '1 1 320px', height: 400 }}>
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
              <Suspense fallback={null}>
                <InnovationScene scrollProgress={scrollProgress} />
              </Suspense>
            </Canvas>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer id="news" style={{ background: T.ink, color: 'rgba(255,255,255,0.8)', padding: '4rem 2rem 0' }}>
        <div style={{ width: '100%', height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)`, marginBottom: '3rem' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', paddingBottom: '3rem' }}>
          {/* Col 1: Logo + tagline + social */}
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: '#fff', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700 }}>COSME</span><span style={{ fontWeight: 300 }}>LINE</span>
            </div>
            <div style={{ color: T.primary, fontSize: '0.85rem', marginBottom: '1.5rem', fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>ความสวยที่ไม่มีที่ติ</div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[{ icon: '📸', href: '#' }, { icon: '📘', href: '#' }, { icon: '▶️', href: '#' }].map((s, i) => (
                <a key={i} href={s.href} style={{ fontSize: '1.3rem', textDecoration: 'none', transition: 'transform 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >{s.icon}</a>
              ))}
            </div>
          </div>

          {/* Col 2: Products */}
          <div>
            <h4 style={{ color: T.gold, fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1.2rem', fontWeight: 600 }}>PRODUCTS</h4>
            {['Institute BCN', 'SRS', 'BTXA', 'Dermaren', 'Hyamax®'].map(p => (
              <div key={p} style={{ marginBottom: '0.6rem' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', textDecoration: 'none', transition: 'color 0.2s', fontFamily: "'IBM Plex Sans Thai', sans-serif" }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                >{p}</a>
              </div>
            ))}
          </div>

          {/* Col 3: Info */}
          <div>
            <h4 style={{ color: T.gold, fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1.2rem', fontWeight: 600 }}>INFO</h4>
            {['About', 'Contact', 'Privacy Policy'].map(item => (
              <div key={item} style={{ marginBottom: '0.6rem' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                >{item}</a>
              </div>
            ))}
          </div>

          {/* Col 4: Contact */}
          <div>
            <h4 style={{ color: T.gold, fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1.2rem', fontWeight: 600 }}>ติดต่อเรา</h4>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.84rem', lineHeight: 1.8, marginBottom: '0.8rem', fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
              บริษัท คอสเมด ฟาร์ม่า จำกัด<br />
              123 อาคารสุขุมวิท ชั้น 8<br />
              ถนนสุขุมวิท แขวงคลองเตย<br />
              เขตคลองเตย กรุงเทพฯ 10110
            </p>
            <a href="tel:+6621234567" style={{ color: T.primary, fontSize: '0.88rem', display: 'block', marginBottom: '0.4rem', textDecoration: 'none' }}>📞 02-123-4567</a>
            <a href="mailto:info@cosmeline.co.th" style={{ color: T.primary, fontSize: '0.88rem', textDecoration: 'none' }}>✉️ info@cosmeline.co.th</a>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem 0', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
            © 2024 บริษัท คอสเมด ฟาร์ม่า จำกัด | Cosmed Pharma Co., Ltd.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Article Card ── */
function ArticleCard({ title, excerpt, date, grad }: { title: string; excerpt: string; date: string; grad: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ flex: '1 1 360px', maxWidth: 420, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', transform: hovered ? 'translateY(-4px)' : 'translateY(0)', cursor: 'pointer' }}
    >
      <div style={{ height: 200, background: grad, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.4s ease', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '4rem' }}>📰</span>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div style={{ color: T.gold, fontSize: '0.72rem', letterSpacing: '0.1em', marginBottom: '0.6rem', fontWeight: 600 }}>{date}</div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: T.ink, lineHeight: 1.4, marginBottom: '0.75rem' }}>{title}</h3>
        <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: '1rem' }}>{excerpt}</p>
        <a href="#" style={{ color: T.deep, fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>อ่านต่อ →</a>
      </div>
    </div>
  );
}

/* ── Auth check SVG mark ── */
function AuthCheckMark() {
  const [drawn, setDrawn] = useState(false);
  const ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setDrawn(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ marginBottom: '1.5rem' }}>
      <circle ref={ref} cx="40" cy="40" r="36" fill="none" stroke={T.gold} strokeWidth="2"
        strokeDasharray="226"
        strokeDashoffset={drawn ? 0 : 226}
        style={{ transition: 'stroke-dashoffset 1.2s ease', transformOrigin: 'center', transform: 'rotate(-90deg)' }}
      />
      <polyline points="24,41 36,53 57,30" fill="none" stroke={T.gold} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="50"
        strokeDashoffset={drawn ? 0 : 50}
        style={{ transition: 'stroke-dashoffset 0.7s ease 0.9s' }}
      />
    </svg>
  );
}
