// Sample HTML loaded into the demo on first visit / Reset.
// Edits persist to localStorage so the inspector round-trip is real.
export const SAMPLE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Brutalist</title>
  <style>
    *,*::before,*::after { box-sizing: border-box; }
    body { margin: 0; font-family: 'Times New Roman', Georgia, serif; background: #f4f1ec; color: #111; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 24px; }

    nav { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 2px solid #111; }
    nav .brand { font-family: 'Arial Black', sans-serif; font-size: 22px; letter-spacing: 0.08em; }
    nav ul { list-style: none; display: flex; gap: 28px; margin: 0; padding: 0; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; }
    nav a { color: #111; text-decoration: none; }

    .label { font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #666; margin: 0 0 12px; }

    .issue { margin: 28px 0 12px; }

    h1.hero { font-family: 'Arial Black', sans-serif; font-size: clamp(64px, 12vw, 160px); line-height: 0.92; letter-spacing: -0.02em; margin: 0; }
    h1.hero .truth { color: #c1121f; }

    .lead { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: end; margin-top: 28px; }
    .lead p { font-family: Georgia, serif; font-size: 17px; line-height: 1.5; max-width: 520px; margin: 0; }
    .feature-num { font-family: 'Arial Black', sans-serif; font-size: 96px; line-height: 1; margin: 0; }
    .feature-num small { display: block; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.22em; color: #666; margin-top: 8px; }

    .actions { margin-top: 36px; display: flex; gap: 12px; }
    .btn { display: inline-block; padding: 14px 22px; font-family: Arial, sans-serif; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; border: 2px solid #111; }
    .btn-primary { background: #111; color: #f4f1ec; }
    .btn-ghost { background: transparent; color: #111; }

    .divider { height: 2px; background: #111; margin: 72px 0 32px; }

    section { margin: 64px 0; }
    section h2 { font-family: 'Arial Black', sans-serif; font-size: clamp(40px, 7vw, 88px); line-height: 0.95; letter-spacing: -0.02em; margin: 0 0 24px; }

    .manifesto { display: grid; grid-template-columns: 1fr 2fr; gap: 48px; }
    .manifesto h2 { font-size: clamp(36px, 6vw, 72px); }
    .manifesto p { font-family: Georgia, serif; font-size: 18px; line-height: 1.55; max-width: 640px; margin: 0 0 18px; }
    .manifesto p:last-child { margin-bottom: 0; }

    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
    .feature { border-top: 2px solid #111; padding-top: 20px; }
    .feature .n { font-family: 'Arial Black', sans-serif; font-size: 56px; line-height: 1; color: #c1121f; }
    .feature h3 { font-family: 'Arial Black', sans-serif; font-size: 18px; letter-spacing: 0.04em; text-transform: uppercase; margin: 14px 0 8px; }
    .feature p { font-family: Georgia, serif; font-size: 15px; line-height: 1.55; color: #333; margin: 0; }

    .archive { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 2px solid #111; }
    .archive article { padding: 28px; border-right: 2px solid #111; border-bottom: 2px solid #111; }
    .archive article:nth-child(2n) { border-right: 0; }
    .archive article:nth-last-child(-n+2) { border-bottom: 0; }
    .archive article .meta { display: flex; justify-content: space-between; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #666; margin-bottom: 12px; }
    .archive article h3 { font-family: 'Arial Black', sans-serif; font-size: 26px; letter-spacing: -0.01em; margin: 0 0 8px; }
    .archive article p { font-family: Georgia, serif; font-size: 15px; line-height: 1.55; color: #333; margin: 0 0 12px; }
    .archive article a { font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #c1121f; text-decoration: none; border-bottom: 2px solid #c1121f; padding-bottom: 2px; }

    blockquote { margin: 0; padding: 48px 24px; border-top: 4px solid #111; border-bottom: 4px solid #111; text-align: center; }
    blockquote p { font-family: 'Arial Black', sans-serif; font-size: clamp(28px, 4.5vw, 56px); line-height: 1.05; letter-spacing: -0.02em; max-width: 920px; margin: 0 auto 18px; }
    blockquote cite { font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; font-style: normal; color: #666; }

    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .stat { border-top: 2px solid #111; padding-top: 16px; }
    .stat .n { font-family: 'Arial Black', sans-serif; font-size: 48px; line-height: 1; }
    .stat small { display: block; margin-top: 6px; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #666; }

    .cta { background: #111; color: #f4f1ec; padding: 56px 32px; }
    .cta h2 { color: #f4f1ec; }
    .cta p { font-family: Georgia, serif; font-size: 18px; line-height: 1.55; max-width: 640px; margin: 0 0 24px; color: #d8d5d0; }
    .cta .btn-primary { background: #c1121f; border-color: #c1121f; color: #fff; }
    .cta .btn-ghost { color: #f4f1ec; border-color: #f4f1ec; }

    footer { margin-top: 72px; padding: 32px 0; border-top: 2px solid #111; display: flex; justify-content: space-between; align-items: center; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #444; }
    footer a { color: #111; text-decoration: none; margin-left: 24px; }
  </style>
</head>
<body>
  <div class="wrap">
    <nav>
      <span class="brand">BRUTALIST</span>
      <ul>
        <li><a href="#">Editorial</a></li>
        <li><a href="#">Archive</a></li>
        <li><a href="#">Studio</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>

    <p class="label issue">Issue 001 — Summer 2026</p>

    <h1 class="hero">RAW<br/>UNFILTERED<br/><span class="truth">TRUTH</span></h1>

    <div class="lead">
      <p>Experimental editorial design for the uncompromising mind. We break grids, challenge conventions, and speak in bold type.</p>
      <p class="feature-num">24<small>FEATURES</small></p>
    </div>

    <div class="actions">
      <a class="btn btn-primary" href="#">Enter the void</a>
      <a class="btn btn-ghost" href="#">Explore</a>
    </div>

    <div class="divider"></div>

    <section class="manifesto">
      <h2>The Manifesto</h2>
      <div>
        <p>We don't decorate. We declare. Every line of type is a position. Every margin, a decision. Every column, a frame around something worth saying.</p>
        <p>The web has spent twenty years rounding its corners and softening its edges. We're here to put the edges back.</p>
        <p>Read slowly. Disagree loudly. Print it out and pin it to a wall.</p>
      </div>
    </section>

    <section>
      <p class="label">What's inside</p>
      <h2>Three things we believe.</h2>
      <div class="features">
        <div class="feature">
          <div class="n">01</div>
          <h3>Type as protest</h3>
          <p>Typography is the loudest part of any page. We pick voices, not fonts.</p>
        </div>
        <div class="feature">
          <div class="n">02</div>
          <h3>Grids as politics</h3>
          <p>The grid decides who gets seen first. We use it deliberately, then break it on purpose.</p>
        </div>
        <div class="feature">
          <div class="n">03</div>
          <h3>White space as oxygen</h3>
          <p>Nothing is the most important thing on the page. Without it, the rest can't breathe.</p>
        </div>
      </div>
    </section>

    <section>
      <p class="label">Featured pieces</p>
      <h2>From the archive.</h2>
      <div class="archive">
        <article>
          <div class="meta"><span>Essay</span><span>12 min read</span></div>
          <h3>The death of the soft button.</h3>
          <p>How a decade of pastel SaaS dashboards drained the language out of interfaces — and what we lost when every button became a suggestion.</p>
          <a href="#">Read essay →</a>
        </article>
        <article>
          <div class="meta"><span>Interview</span><span>Issue 003</span></div>
          <h3>A printer who refused to leave letterpress.</h3>
          <p>Forty years, one Vandercook, zero regrets. A conversation about doing one thing very slowly while the world refuses to.</p>
          <a href="#">Read interview →</a>
        </article>
        <article>
          <div class="meta"><span>Photo Essay</span><span>Field notes</span></div>
          <h3>Signs that survived.</h3>
          <p>Hand-painted shop signs in a city that mostly forgot how to make them. Documented across two summers and one stubborn winter.</p>
          <a href="#">View essay →</a>
        </article>
        <article>
          <div class="meta"><span>Manifesto</span><span>Editorial</span></div>
          <h3>Against the round corner.</h3>
          <p>A short, polemical defense of the right angle. Includes diagrams, footnotes, and one wholly unjustified rant about border-radius.</p>
          <a href="#">Read piece →</a>
        </article>
      </div>
    </section>

    <blockquote>
      <p>"Restraint is a privilege of those with nothing left to prove."</p>
      <cite>— Margins, vol. 4</cite>
    </blockquote>

    <section>
      <p class="label">In numbers</p>
      <h2>Four years, four printings.</h2>
      <div class="stats">
        <div class="stat"><div class="n">12</div><small>Issues</small></div>
        <div class="stat"><div class="n">87</div><small>Contributors</small></div>
        <div class="stat"><div class="n">3,400</div><small>Print runs</small></div>
        <div class="stat"><div class="n">0</div><small>Sponsored posts</small></div>
      </div>
    </section>

    <section class="cta">
      <p class="label" style="color:#aaa">Subscribe</p>
      <h2>Get the next issue.<br/>By mail. On paper.</h2>
      <p>Four issues a year, delivered to your door. No ads, no algorithm, no analytics. Just words and ink and someone deciding what comes after what.</p>
      <div class="actions">
        <a class="btn btn-primary" href="#">Subscribe — $48/yr</a>
        <a class="btn btn-ghost" href="#">Read sample</a>
      </div>
    </section>

    <footer>
      <span>© Brutalist Press 2026</span>
      <div>
        <a href="#">Colophon</a>
        <a href="#">Submit</a>
        <a href="#">Index</a>
      </div>
    </footer>
  </div>
</body>
</html>`;
