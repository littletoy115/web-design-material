import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import HeroScene from './HeroScene';
import ScienceScene from './ScienceScene';
import ProductScene from './ProductScene';

/* ── Intersection-based fade-in ── */
function FadeIn({
  children,
  delay = 0,
  dir = 'up',
}: {
  children: React.ReactNode;
  delay?: number;
  dir?: 'up' | 'left' | 'right';
}) {
  const [v, setV] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.12 });
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

/* ── Reusable gradient text ── */
function GradText({ children, from, to, style }: {
  children: React.ReactNode; from: string; to: string; style?: React.CSSProperties;
}) {
  return (
    <span style={{
      background: `linear-gradient(135deg, ${from}, ${to})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      display: 'inline',
      ...style,
    }}>{children}</span>
  );
}

/* ─────────────────── STATS BAND ─────────────────── */
const STATS = [
  { n: '98%',   l: 'เห็นผลใน 28 วัน' },
  { n: '7x',    l: 'ชุ่มชื้นลึกกว่าปกติ' },
  { n: '72h',   l: 'ความชุ่มชื้นยาวนาน' },
  { n: '10M+',  l: 'ผู้ใช้ทั่วโลก' },
];

/* ─────────────────── FEATURE DATA ─────────────────── */
const FEATURES = [
  { icon: '💧', title: 'Hyaluronic Acid Complex',  desc: 'เจาะลึกถึงชั้นผิวในระดับโมเลกุล ดึงน้ำจากอากาศสู่ผิวตลอด 24 ชั่วโมง' },
  { icon: '🧬', title: 'Peptide Matrix',            desc: 'เพปไทด์สังเคราะห์ระดับสูง กระตุ้นคอลลาเจน ลดริ้วรอยเห็นชัดใน 14 วัน' },
  { icon: '✨', title: 'Collagen Booster',          desc: 'คืนความยืดหยุ่น กระชับผิวจากภายใน ไม่มีสารเคมีอันตราย' },
  { icon: '🌿', title: 'Botanical Extract',         desc: 'สารสกัดจากธรรมชาติ 12 ชนิด ต้านอนุมูลอิสระ ผิวกระจ่างใสขึ้น' },
  { icon: '🔬', title: 'Lab-Certified Formula',     desc: 'ผ่านการทดสอบทางคลินิกจากยุโรป ปลอดภัยสำหรับผิวแพ้ง่าย' },
];

/* ─────────────────── TESTIMONIALS ─────────────────── */
const REVIEWS = [
  { name: 'ปาล์มมี่', role: 'Beauty Blogger', text: 'ผิวชุ่มชื้นขึ้นมากใน 2 สัปดาห์แรก ประทับใจมากค่ะ' },
  { name: 'Alex K.', role: 'Dermatologist', text: 'Formula is clinically sound. HA multi-weight is the right approach.' },
  { name: 'ฟ้าใส', role: 'Skincare Enthusiast', text: 'ลองมาหลายยี่ห้อ แต่ HYAMAX ดีที่สุดที่เคยใช้' },
  { name: 'Mina J.', role: 'Model', text: 'My skin looks glass-like every morning. Absolutely obsessed.' },
];

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function HyamaxPage() {
  return (
    <div style={{ background: '#030014', color: '#fff', fontFamily: "'Segoe UI', Helvetica, sans-serif", overflowX: 'hidden' }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.9rem 2.5rem',
        background: 'rgba(3,0,20,0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(167,139,250,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #c4b5fd, #4f46e5)',
            boxShadow: '0 0 14px #7c3aed88',
          }} />
          <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.12em', color: '#c4b5fd' }}>HYAMAX</span>
        </div>

        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
          {['Science', 'Benefits', 'Product', 'Reviews'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              textDecoration: 'none', color: '#94a3b8',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >{l}</a>
          ))}
        </div>

        <button style={{
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          color: '#fff', border: 'none', borderRadius: 8,
          padding: '0.5rem 1.25rem', cursor: 'pointer',
          fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em',
          boxShadow: '0 0 18px #7c3aed55',
          transition: 'box-shadow 0.2s, transform 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 32px #7c3aed99'; e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 18px #7c3aed55'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          Shop Now
        </button>
      </nav>

      {/* ══ SECTION 1 — HERO ══ */}
      <section style={{ height: '100vh', position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Full-bleed 3D canvas */}
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}
          style={{ position: 'absolute', inset: 0 }}
          gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>

        {/* Gradient vignette */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to right, rgba(3,0,20,0.88) 38%, rgba(3,0,20,0.2) 70%, transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%', pointerEvents: 'none',
          background: 'linear-gradient(to top, #030014, transparent)' }} />

        {/* Text block — left */}
        <div style={{ position: 'relative', zIndex: 2, padding: '0 4rem', maxWidth: 540 }}>
          <FadeIn delay={0}>
            <p style={{ color: '#a78bfa', fontSize: '0.75rem', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Advanced Skincare Science
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5rem)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 1.2rem', letterSpacing: '-0.02em' }}>
              <GradText from="#ffffff" to="#c4b5fd">The Future<br />of Skin<br />Hydration.</GradText>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.75, marginBottom: '2.2rem', maxWidth: 400 }}>
              HA หลายระดับโมเลกุล ชุ่มชื้นลึก 7 ชั้น ยาวนาน 72 ชั่วโมง
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div style={{ display: 'flex', gap: '0.9rem' }}>
              <button style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '0.9rem 2rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700,
                boxShadow: '0 0 32px #7c3aed77',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 48px #7c3aedaa'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 32px #7c3aed77'; }}
              >สั่งซื้อเลย</button>

              <button style={{
                background: 'transparent', border: '1px solid rgba(167,139,250,0.35)',
                color: '#c4b5fd', borderRadius: 10,
                padding: '0.9rem 1.6rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
                transition: 'background 0.2s, border-color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; e.currentTarget.style.borderColor = '#a78bfa'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.35)'; }}
              >ดูรายละเอียด</button>
            </div>
          </FadeIn>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, #7c3aed, transparent)' }} />
        </div>
      </section>

      {/* ══ STATS BAND ══ */}
      <section style={{
        padding: '4rem 2rem',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.06))',
        borderTop: '1px solid rgba(167,139,250,0.1)',
        borderBottom: '1px solid rgba(167,139,250,0.1)',
      }}>
        <FadeIn>
          <p style={{ textAlign: 'center', color: '#c4b5fd', fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
            Simple. Effective. Beautiful.
          </p>
        </FadeIn>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(2rem, 6vw, 5rem)', flexWrap: 'wrap' }}>
          {STATS.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.1}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, lineHeight: 1,
                  background: 'linear-gradient(135deg, #c4b5fd, #818cf8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{s.n}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', letterSpacing: '0.05em' }}>{s.l}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══ SECTION 2 — SCIENCE (DNA) ══ */}
      <section id="science" style={{ height: '100vh', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Canvas camera={{ position: [0, 0, 7], fov: 55 }}
          style={{ position: 'absolute', inset: 0 }}
          gl={{ antialias: true }}>
          <color attach="background" args={['#030014']} />
          <Suspense fallback={null}><ScienceScene /></Suspense>
        </Canvas>

        {/* Left vignette */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to right, rgba(3,0,20,0.92) 42%, rgba(3,0,20,0.3) 65%, transparent)' }} />

        {/* Text — left */}
        <div style={{ position: 'relative', zIndex: 2, padding: '0 4rem', maxWidth: 480 }}>
          <FadeIn>
            <p style={{ color: '#34d399', fontSize: '0.7rem', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Advanced Formula
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
              <GradText from="#ffffff" to="#a7f3d0">Science<br />Backed.<br />Results<br />Proven.</GradText>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: '2rem' }}>
              วิจัยและพัฒนามากกว่า 10 ปี จากห้องปฏิบัติการชั้นนำในยุโรป
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ══ BENEFITS GRID ══ */}
      <section id="benefits" style={{ padding: '6rem 2rem' }}>
        <FadeIn>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
            <GradText from="#c4b5fd" to="#60a5fa">What's Inside.</GradText>
          </h2>
          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.9rem', marginBottom: '3.5rem' }}>
            ส่วนผสมที่คัดสรรอย่างพิถีพิถัน ทุกหยดมีความหมาย
          </p>
        </FadeIn>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          maxWidth: 1100,
          margin: '0 auto',
        }}>
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.1}>
              <div style={{
                padding: '1.75rem 1.5rem',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(8px)',
                transition: 'background 0.3s, border-color 0.3s, transform 0.3s',
                cursor: 'default',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = 'rgba(124,58,237,0.1)';
                  el.style.borderColor = 'rgba(167,139,250,0.35)';
                  el.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = 'rgba(255,255,255,0.02)';
                  el.style.borderColor = 'rgba(255,255,255,0.06)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══ SECTION 3 — PRODUCT (alternating: 3D right, text left) ══ */}
      <section id="product" style={{ height: '100vh', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Canvas camera={{ position: [0, 1, 6], fov: 50 }}
          style={{ position: 'absolute', inset: 0 }}
          gl={{ antialias: true }}>
          <color attach="background" args={['#030014']} />
          <Suspense fallback={null}><ProductScene /></Suspense>
          <OrbitControls enableZoom={false} enablePan={false}
            autoRotate autoRotateSpeed={0.6}
            minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} />
        </Canvas>

        {/* Right vignette (text is on right this time) */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to left, rgba(3,0,20,0.92) 42%, rgba(3,0,20,0.3) 65%, transparent)' }} />

        {/* Text — right */}
        <div style={{ position: 'relative', zIndex: 2, marginLeft: 'auto', padding: '0 4rem', maxWidth: 480 }}>
          <FadeIn dir="right">
            <p style={{ color: '#f472b6', fontSize: '0.7rem', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Premium Collection
            </p>
          </FadeIn>
          <FadeIn dir="right" delay={0.1}>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
              <GradText from="#ffffff" to="#f9a8d4">HYAMAX<br />Ultimate<br />Serum.</GradText>
            </h2>
          </FadeIn>
          <FadeIn dir="right" delay={0.2}>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: '2rem' }}>
              เซรั่มสูตรเข้มข้น HA หลายระดับ + Peptide Matrix<br />
              ผลลัพธ์ที่เห็นได้จริงใน 28 วัน
            </p>
          </FadeIn>
          <FadeIn dir="right" delay={0.3}>
            <div style={{
              display: 'flex', gap: '1.5rem', alignItems: 'center',
              padding: '1.25rem 1.5rem', borderRadius: 14, marginBottom: '1.5rem',
              background: 'rgba(244,114,182,0.06)',
              border: '1px solid rgba(244,114,182,0.18)',
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#475569', marginBottom: 4 }}>ราคา</div>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>
                  <GradText from="#f9a8d4" to="#f472b6">฿2,890</GradText>
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'right', lineHeight: 1.6 }}>
                30ml · ใช้ได้ 2 เดือน<br />
                <span style={{ color: '#34d399' }}>✓ ส่งฟรีทั่วไทย</span>
              </div>
            </div>
          </FadeIn>
          <FadeIn dir="right" delay={0.4}>
            <button style={{
              width: '100%',
              background: 'linear-gradient(135deg, #db2777, #7c3aed)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '1rem 2rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
              boxShadow: '0 0 40px rgba(219,39,119,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 60px rgba(219,39,119,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(219,39,119,0.35)'; }}
            >เพิ่มในตะกร้า</button>
          </FadeIn>
        </div>
      </section>

      {/* ══ REVIEWS (Social Proof) ══ */}
      <section id="reviews" style={{ padding: '6rem 2rem', background: 'rgba(255,255,255,0.01)' }}>
        <FadeIn>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
            <GradText from="#f9a8d4" to="#a78bfa">Real Results.<br />Real People.</GradText>
          </h2>
          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.9rem', marginBottom: '3rem' }}>
            Join millions of users who trust HYAMAX
          </p>
        </FadeIn>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem', maxWidth: 960, margin: '0 auto',
        }}>
          {REVIEWS.map((r, i) => (
            <FadeIn key={r.name} delay={i * 0.1}>
              <div style={{
                padding: '1.5rem',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(8px)',
              }}>
                {/* Stars */}
                <div style={{ color: '#fbbf24', fontSize: '0.8rem', marginBottom: '0.75rem' }}>★★★★★</div>
                <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1rem', fontStyle: 'italic' }}>
                  "{r.text}"
                </p>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e2e8f0' }}>{r.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569' }}>{r.role}</div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{
        padding: '7rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <FadeIn>
          <p style={{ color: '#a78bfa', fontSize: '0.75rem', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Ready?
          </p>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            <GradText from="#ffffff" to="#c4b5fd">Let's Glow.</GradText>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '2.5rem', maxWidth: 400, margin: '0 auto 2.5rem' }}>
            ผิวสวยในแบบของคุณ เริ่มต้นวันนี้
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '1rem 2.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
              boxShadow: '0 0 40px #7c3aed66',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 0 60px #7c3aed99'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 40px #7c3aed66'; }}
            >
              สั่งซื้อเลย — ฿2,890
            </button>
            <button style={{
              background: 'transparent', border: '1px solid rgba(167,139,250,0.35)',
              color: '#a78bfa', borderRadius: 12,
              padding: '1rem 2rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 500,
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ดูรีวิวเพิ่มเติม
            </button>
          </div>
        </FadeIn>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{
        padding: '2.5rem',
        borderTop: '1px solid rgba(167,139,250,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'radial-gradient(circle, #c4b5fd, #4f46e5)' }} />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#c4b5fd', letterSpacing: '0.1em' }}>HYAMAX</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#334155' }}>
          {['Privacy Policy', 'Terms of Use', 'Support', 'About'].map(l => (
            <a key={l} href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
              onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
            >{l}</a>
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: '#1e293b' }}>
          © {new Date().getFullYear()} Hyamax Co., Ltd.
        </span>
      </footer>
    </div>
  );
}
