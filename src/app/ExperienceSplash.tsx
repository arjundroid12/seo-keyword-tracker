'use client';

/**
 * ExperienceSplash — classic loading intro that splits into a "two doors" chooser
 * between the Dungeon and Terminal portfolios.
 *
 * Stage 1: ARJUN® wordmark + loading bar (0→100%, cycling status lines, ~2.5s,
 *          any key/click skips). At 100% a gold/cyan seam glows down the middle
 *          and the screen cracks in half — the split reveals stage 2.
 * Stage 2: the two-doors chooser (dungeon vs terminal).
 *
 * Drop-in replacement for the current "Choose your experience" overlay on arjunv.is-a.dev.
 * Self-contained: no dependencies beyond React. Uses the site's TrenchSlab font with
 * Cinzel/serif fallback, and JetBrains Mono for the terminal door.
 * Pass `intro={false}` to skip straight to the chooser.
 *
 * Usage:
 *   {showSplash && (
 *     <ExperienceSplash
 *       onChoose={(choice) => {
 *         sessionStorage.setItem('experience', choice);   // optional: remember
 *         if (choice === 'terminal') router.push('/terminal');
 *         else setShowSplash(false);                      // dungeon is this page
 *       }}
 *     />
 *   )}
 *
 * If `onChoose` is omitted, it navigates to dungeonHref / terminalHref itself
 * (after the exit animation).
 */

import { useEffect, useRef, useState } from 'react';

type Choice = 'dungeon' | 'terminal';

const PHRASES = ['./enter --fast', 'ls ./projects', 'sudo hire-me', 'snake'];
const EMBER_COLORS = ['#ffb454', '#e8c66a', '#f7768e', '#ff9e64'];
const STATUSES = ['waking the goddess…', 'compiling shaders…', 'mounting /terminal…', 'sharpening swords…', 'ready.'];

export default function ExperienceSplash({
  dungeonHref = '/',
  terminalHref = '/terminal',
  intro = true,
  onChoose,
}: {
  dungeonHref?: string;
  terminalHref?: string;
  /** show the loading intro before the two-doors chooser (default true) */
  intro?: boolean;
  onChoose?: (choice: Choice) => void;
}) {
  const [sel, setSel] = useState<-1 | 0 | 1>(-1);
  const [leaving, setLeaving] = useState<Choice | null>(null);
  const [typed, setTyped] = useState('');
  const [introOn, setIntroOn] = useState(intro);
  const [introSplit, setIntroSplit] = useState(false);
  const [armed, setArmed] = useState(false);
  const [prog, setProg] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leavingRef = useRef<Choice | null>(null);
  const introRef = useRef(intro);
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const endIntro = (instant = false) => {
    if (!introRef.current) return;
    introRef.current = false;
    if (instant) { setIntroOn(false); return; }
    setIntroSplit(true);                       // halves slide apart, chooser animates in
    setTimeout(() => setIntroOn(false), 900);  // unmount after the split
  };

  /* stage 1: fake loading, then split */
  useEffect(() => {
    if (!intro) { introRef.current = false; setIntroOn(false); return; }
    if (reduced) { endIntro(true); return; }
    let p = 0;
    const timer = setInterval(() => {
      p = Math.min(100, p + 1.2 + Math.random() * 2.8);
      setProg(p);
      if (p >= 100) {
        clearInterval(timer);
        setArmed(true);                          // seam glows...
        setTimeout(() => endIntro(), 380);       // ...then the crack opens
      }
    }, 40);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (choice: Choice) => {
    if (leavingRef.current) return;
    leavingRef.current = choice;
    const finish = () => {
      if (onChoose) onChoose(choice);
      else window.location.href = choice === 'dungeon' ? dungeonHref : terminalHref;
    };
    if (reduced) return finish();
    setLeaving(choice);
    setTimeout(finish, 750);
  };

  /* embers on the dungeon door */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = () => {
      canvas.width = canvas.offsetWidth || 300;
      canvas.height = canvas.offsetHeight || 300;
    };
    size();
    window.addEventListener('resize', size);
    type P = { x: number; y: number; r: number; vy: number; wob: number; ws: number; a: number; c: string };
    const spawn = (): P => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 6,
      r: 0.8 + Math.random() * 2.2,
      vy: 0.35 + Math.random() * 0.9,
      wob: Math.random() * Math.PI * 2,
      ws: 0.01 + Math.random() * 0.03,
      a: 0.25 + Math.random() * 0.55,
      c: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
    });
    const ps: P[] = Array.from({ length: 36 }, () => ({ ...spawn(), y: Math.random() * canvas.height }));
    const timer = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach((p, i) => {
        p.y -= p.vy;
        p.wob += p.ws;
        p.x += Math.sin(p.wob) * 0.4;
        if (p.y < -8) ps[i] = spawn();
        ctx.globalAlpha = p.a * Math.min(1, p.y / (canvas.height * 0.5));
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }, 33);
    return () => { clearInterval(timer); window.removeEventListener('resize', size); };
  }, [reduced]);

  /* typing loop on the terminal door */
  useEffect(() => {
    if (reduced) { setTyped(PHRASES[0]); return; }
    let pi = 0, ci = 0, dir = 1;
    const timer = setInterval(() => {
      const ph = PHRASES[pi];
      ci += dir;
      if (ci > ph.length + 14) { dir = -1; ci = ph.length; }
      if (ci < 0) { dir = 1; ci = 0; pi = (pi + 1) % PHRASES.length; }
      setTyped(ph.slice(0, Math.max(0, Math.min(ci, ph.length))));
    }, 90);
    return () => clearInterval(timer);
  }, [reduced]);

  /* keyboard: 1 / 2 / arrows / enter */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (leavingRef.current) return;
      if (introRef.current) { endIntro(); return; }   // any key skips the intro
      const k = e.key.toLowerCase();
      if (k === '1') choose('dungeon');
      else if (k === '2') choose('terminal');
      else if (k === 'arrowleft' || k === 'arrowup') { e.preventDefault(); setSel(0); }
      else if (k === 'arrowright' || k === 'arrowdown') { e.preventDefault(); setSel(1); }
      else if (k === 'enter') setSel(s => { if (s === 0) choose('dungeon'); if (s === 1) choose('terminal'); return s; });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doorCls = (idx: 0 | 1, base: string) =>
    [
      'xs-door',
      base,
      sel === idx ? 'sel' : '',
      leaving && ((idx === 0 && leaving === 'dungeon') || (idx === 1 && leaving === 'terminal')) ? 'chosen' : '',
    ].join(' ');

  const stat = STATUSES[Math.min(STATUSES.length - 1, Math.floor(prog / 25))];
  const introInner = (
    <div className="xs-icontent">
      <div className="xs-iwrap">
        <div className="xs-ilabel">arjun vashishtha · portfolio</div>
        <div className="xs-iname">ARJUN<span className="xs-rr">®</span></div>
        <div className="xs-ibar"><span className="xs-ifill" style={{ width: prog + '%' }} /></div>
        <div className="xs-irow"><span>{stat}</span><span>{Math.floor(prog)}%</span></div>
      </div>
    </div>
  );

  return (
    <div
      className={'xs-splash' + (leaving ? ' leaving' : '') + (introOn && !introSplit ? ' with-intro' : '')}
      role="dialog"
      aria-label="Choose your experience"
    >
      {introOn && (
        <div
          className={'xs-intro' + (armed ? ' arm' : '') + (introSplit ? ' done' : '')}
          aria-hidden="true"
          onClick={() => endIntro()}
        >
          <div className="xs-half l">{introInner}</div>
          <div className="xs-half r">{introInner}</div>
        </div>
      )}
      <header className="xs-head">
        <div className="xs-who">Arjun Vashishtha</div>
        <h1>Choose your experience</h1>
        <div className="xs-sub">Two portfolios · one creator</div>
      </header>

      <main className={'xs-doors' + (sel >= 0 ? ' has-focus' : '')} onMouseMove={() => sel >= 0 && setSel(-1)}>
        <a
          className={doorCls(0, 'dungeon')}
          href={dungeonHref}
          onClick={e => { e.preventDefault(); choose('dungeon'); }}
          aria-label="Enter the Dungeon portfolio — story mode"
        >
          <canvas className="xs-embers" ref={canvasRef} />
          <div className="xs-inner">
            <div className="xs-glyph">⚔️</div>
            <h2>THE DUNGEON</h2>
            <p className="xs-mode">Story Mode</p>
            <p className="xs-desc">Parallax caves · a king with attack animations · quests, loot &amp; a sarcastic goddess. Bring headphones.</p>
            <span className="xs-cta">Enter the gate →</span>
          </div>
          <span className="xs-keycap">1</span>
        </a>

        <div className="xs-divider" aria-hidden="true"><span>or</span></div>

        <a
          className={doorCls(1, 'terminal')}
          href={terminalHref}
          onClick={e => { e.preventDefault(); choose('terminal'); }}
          aria-label="Enter the Terminal portfolio — speedrun mode"
        >
          <div className="xs-dots" aria-hidden="true"><i /><i /><i /></div>
          <div className="xs-inner">
            <div className="xs-glyph mono">&gt;_</div>
            <h2>THE TERMINAL</h2>
            <p className="xs-mode">Speedrun Mode</p>
            <p className="xs-desc">Type commands · play snake · hack the mainframe · unlock achievements.</p>
            <span className="xs-cta"><span className="xs-u">visitor@web</span>:~$ {typed}<span className="xs-cursor" /></span>
          </div>
          <span className="xs-keycap">2</span>
        </a>
      </main>

      <footer className="xs-foot">
        press <kbd>1</kbd> or <kbd>2</kbd> · <kbd>←</kbd><kbd>→</kbd> + <kbd>enter</kbd> · or walk through a door
      </footer>
      <div className="xs-fade" />

      <style>{`
.xs-splash{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;background:radial-gradient(1000px 500px at 50% -10%,rgba(139,92,246,.06),transparent 60%),#0a0a0f;font-family:Inter,system-ui,sans-serif;color:#e9e1f2}
.xs-splash::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.5))}
.xs-head{text-align:center;padding:clamp(28px,5vh,52px) 20px 10px;animation:xsin .8s cubic-bezier(.2,.7,.3,1) both;z-index:2}
.xs-who{font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:5px;color:#6b6b80;text-transform:uppercase;margin-bottom:10px}
.xs-head h1{font-family:TrenchSlab,Cinzel,serif;font-weight:900;font-size:clamp(28px,5vw,52px);letter-spacing:1px;background:linear-gradient(100deg,#e8c66a 0%,#e9e1f2 45%,#7dcfff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;margin:0}
.xs-sub{margin-top:8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#6b6b80}
@keyframes xsin{from{opacity:0;transform:translateY(-16px)}}
.xs-doors{flex:1;display:flex;padding:clamp(16px,3vh,30px) clamp(16px,4vw,48px) clamp(10px,2vh,18px);min-height:0;z-index:2}
.xs-door{position:relative;flex:1;display:flex;align-items:center;justify-content:center;border-radius:14px;overflow:hidden;cursor:pointer;text-decoration:none;color:inherit;transition:flex .5s cubic-bezier(.2,.7,.3,1),filter .5s,box-shadow .5s;outline:none}
.xs-doors.has-focus .xs-door:not(.sel),.xs-doors:hover .xs-door:not(:hover){filter:saturate(.35) brightness(.55)}
.xs-door:hover,.xs-door.sel{flex:1.35}
.xs-door:focus-visible{box-shadow:0 0 0 2px #e9e1f2}
.xs-door.dungeon{background:radial-gradient(120% 90% at 20% 100%,rgba(220,20,60,.28),transparent 55%),radial-gradient(100% 70% at 80% 0%,rgba(139,0,0,.35),transparent 60%),radial-gradient(60% 45% at 50% 88%,rgba(255,158,100,.22),transparent 70%),linear-gradient(#140609,#1a0507 55%,#0d0304);animation:xsL .8s .15s cubic-bezier(.2,.7,.3,1) both;margin-right:clamp(8px,1.2vw,14px)}
.xs-door.dungeon:hover,.xs-door.dungeon.sel{box-shadow:0 0 60px rgba(232,198,106,.15),inset 0 0 80px rgba(220,20,60,.12)}
.xs-door.dungeon::before{content:"";position:absolute;inset:10px;border:1px solid rgba(232,198,106,.4);border-radius:9px;pointer-events:none}
.xs-door.dungeon::after{content:"";position:absolute;inset:15px;border:1px solid rgba(232,198,106,.15);border-radius:7px;pointer-events:none}
.xs-embers{position:absolute;inset:0;pointer-events:none}
.xs-door.terminal{background:radial-gradient(110% 80% at 80% 100%,rgba(125,207,255,.10),transparent 55%),radial-gradient(90% 60% at 20% 0%,rgba(122,162,247,.10),transparent 60%),linear-gradient(#171821,#16161e 55%,#101017);border:1px solid #292e42;animation:xsR .8s .15s cubic-bezier(.2,.7,.3,1) both;margin-left:clamp(8px,1.2vw,14px)}
.xs-door.terminal:hover,.xs-door.terminal.sel{box-shadow:0 0 60px rgba(125,207,255,.14),inset 0 0 80px rgba(125,207,255,.05)}
.xs-door.terminal::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(rgba(0,0,0,0) 0 2px,rgba(0,0,0,.22) 3px 3px);mix-blend-mode:multiply}
.xs-dots{position:absolute;top:14px;left:16px;display:flex;gap:6px}
.xs-dots i{width:9px;height:9px;border-radius:50%;background:#292e42}
@keyframes xsL{from{opacity:0;transform:translateX(-34px)}}
@keyframes xsR{from{opacity:0;transform:translateX(34px)}}
.xs-inner{text-align:center;padding:24px;max-width:420px;z-index:1}
.xs-glyph{font-size:clamp(34px,6vh,54px);margin-bottom:clamp(8px,2vh,18px);filter:drop-shadow(0 0 14px rgba(232,198,106,.5))}
.terminal .xs-glyph{font-family:"JetBrains Mono",monospace;font-weight:700;color:#7dcfff;filter:drop-shadow(0 0 14px rgba(125,207,255,.5))}
.xs-door h2{font-size:clamp(24px,3.6vw,40px);letter-spacing:2px;margin:0}
.dungeon h2{font-family:TrenchSlab,Cinzel,serif;font-weight:900;color:#e8c66a;text-shadow:0 0 22px rgba(232,198,106,.35)}
.terminal h2{font-family:"JetBrains Mono",monospace;font-weight:700;color:#7dcfff;text-shadow:0 0 22px rgba(125,207,255,.3)}
.xs-mode{margin:8px 0 0;font-size:11px;letter-spacing:4px;text-transform:uppercase}
.dungeon .xs-mode{color:#ff9e64}
.terminal .xs-mode{color:#9ece6a;font-family:"JetBrains Mono",monospace}
.xs-desc{margin:clamp(8px,2vh,16px) 0 0;font-size:13.5px;line-height:1.7;color:#6b6b80}
.terminal .xs-desc{font-family:"JetBrains Mono",monospace;font-size:12.5px}
.xs-cta{display:inline-block;margin-top:clamp(12px,3vh,24px);font-size:13px;letter-spacing:1px;padding:10px 18px;border-radius:8px;transition:.25s}
.dungeon .xs-cta{font-family:TrenchSlab,Cinzel,serif;color:#e8c66a;border:1px solid rgba(232,198,106,.45);background:rgba(232,198,106,.06)}
.xs-door.dungeon:hover .xs-cta,.xs-door.dungeon.sel .xs-cta{background:rgba(232,198,106,.16);box-shadow:0 0 18px rgba(232,198,106,.25)}
.terminal .xs-cta{font-family:"JetBrains Mono",monospace;font-size:12.5px;color:#c0caf5;border:1px solid #292e42;background:rgba(125,207,255,.04);text-align:left}
.xs-door.terminal:hover .xs-cta,.xs-door.terminal.sel .xs-cta{border-color:#7dcfff;box-shadow:0 0 18px rgba(125,207,255,.18)}
.xs-u{color:#9ece6a;font-weight:700}
.xs-cursor{display:inline-block;width:7px;height:13px;background:#7dcfff;vertical-align:-2px;margin-left:2px;animation:xsblink 1.1s steps(1) infinite}
@keyframes xsblink{50%{opacity:0}}
.xs-keycap{position:absolute;bottom:14px;right:16px;font-family:"JetBrains Mono",monospace;font-size:11px;color:#6b6b80;border:1px solid rgba(255,255,255,.14);border-bottom-width:2px;border-radius:5px;padding:2px 8px;background:rgba(0,0,0,.3)}
.xs-divider{align-self:center;z-index:3;width:0;display:flex;align-items:center;justify-content:center;animation:xsin .8s .3s both}
.xs-divider span{display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:1px;color:#e9e1f2;background:#0a0a0f;position:relative;flex:none}
.xs-divider span::before{content:"";position:absolute;inset:-1px;border-radius:50%;padding:1px;background:linear-gradient(90deg,#e8c66a 0 50%,#7dcfff 50% 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.xs-foot{text-align:center;padding:6px 16px clamp(16px,3vh,26px);font-size:12px;color:#6b6b80;animation:xsin .8s .45s both;z-index:2}
.xs-foot kbd{font-family:"JetBrains Mono",monospace;font-size:11px;border:1px solid rgba(255,255,255,.16);border-bottom-width:2px;border-radius:4px;padding:1px 6px;margin:0 2px}
.xs-splash.leaving .xs-door{pointer-events:none}
.xs-splash.leaving .xs-door.chosen{flex:30;filter:none}
.xs-splash.leaving .xs-door:not(.chosen){flex:.0001;opacity:0;margin:0}
.xs-splash.leaving .xs-head,.xs-splash.leaving .xs-foot,.xs-splash.leaving .xs-divider{opacity:0;transition:opacity .4s}
.xs-fade{position:absolute;inset:0;background:#0a0a0f;opacity:0;pointer-events:none;transition:opacity .45s ease .25s;z-index:10}
.xs-splash.leaving .xs-fade{opacity:1}
@media (max-width:760px){
.xs-doors{flex-direction:column;padding:12px 16px}
.xs-door.dungeon{margin:0 0 8px;animation-name:xsT}
.xs-door.terminal{margin:8px 0 0;animation-name:xsB}
.xs-door:hover,.xs-door.sel{flex:1.25}
.xs-divider{height:0}
.xs-desc{display:none}
.xs-glyph{margin-bottom:6px}
}
@keyframes xsT{from{opacity:0;transform:translateY(-24px)}}
@keyframes xsB{from{opacity:0;transform:translateY(24px)}}
.xs-intro{position:absolute;inset:0;z-index:20}
.xs-half{position:absolute;top:0;bottom:0;width:50.05%;overflow:hidden;background:#0a0a0f;transition:transform .85s cubic-bezier(.7,0,.2,1)}
.xs-half.l{left:0}
.xs-half.r{right:0}
.xs-icontent{position:absolute;top:0;bottom:0;width:200%;display:flex;align-items:center;justify-content:center}
.xs-half.l .xs-icontent{left:0}
.xs-half.r .xs-icontent{right:0}
.xs-intro::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:1px;background:linear-gradient(180deg,transparent,rgba(232,198,106,.55) 30%,rgba(125,207,255,.55) 70%,transparent);opacity:0;transition:opacity .35s;z-index:21}
.xs-intro.arm::before{opacity:1}
.xs-intro.done::before{opacity:0}
.xs-intro.done .xs-half.l{transform:translateX(-101%)}
.xs-intro.done .xs-half.r{transform:translateX(101%)}
.xs-iwrap{text-align:center}
.xs-ilabel{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:4px;color:#6b6b80;text-transform:uppercase;margin-bottom:14px}
.xs-iname{font-family:TrenchSlab,Cinzel,serif;font-weight:900;font-size:clamp(48px,10vw,110px);letter-spacing:2px;line-height:1;background:linear-gradient(100deg,#e8c66a 0%,#e9e1f2 45%,#7dcfff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;animation:xsnamein .9s ease both}
.xs-rr{font-size:.32em;vertical-align:super;letter-spacing:0}
@keyframes xsnamein{from{opacity:0;transform:translateY(10px) scale(.98);filter:blur(6px)}}
.xs-ibar{width:min(300px,60vw);height:2px;background:rgba(255,255,255,.09);margin:26px auto 10px;border-radius:2px;overflow:hidden}
.xs-ifill{display:block;height:100%;background:linear-gradient(90deg,#e8c66a,#7dcfff);box-shadow:0 0 12px rgba(125,207,255,.6);transition:width .12s linear}
.xs-irow{display:flex;justify-content:space-between;width:min(300px,60vw);margin:0 auto;font-family:"JetBrains Mono",monospace;font-size:11px;color:#6b6b80}
.xs-splash.with-intro .xs-head,.xs-splash.with-intro .xs-door,.xs-splash.with-intro .xs-divider,.xs-splash.with-intro .xs-foot{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){
.xs-head,.xs-door,.xs-divider,.xs-foot,.xs-iname{animation:none}
.xs-door,.xs-cta{transition:none}
.xs-cursor{animation:none}
}
      `}</style>
    </div>
  );
}
