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
    .issue { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #666; margin: 28px 0 12px; }
    h1.hero { font-family: 'Arial Black', sans-serif; font-size: clamp(64px, 12vw, 160px); line-height: 0.92; letter-spacing: -0.02em; margin: 0; }
    h1.hero .truth { color: #c1121f; }
    .lead { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: end; margin-top: 28px; }
    .lead p { font-family: Georgia, serif; font-size: 17px; line-height: 1.5; max-width: 520px; }
    .feature-num { font-family: 'Arial Black', sans-serif; font-size: 96px; line-height: 1; margin: 0; }
    .feature-num small { display: block; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.22em; color: #666; margin-top: 8px; }
    .actions { margin-top: 36px; display: flex; gap: 12px; }
    .btn { display: inline-block; padding: 14px 22px; font-family: Arial, sans-serif; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; border: 2px solid #111; }
    .btn-primary { background: #111; color: #f4f1ec; }
    .btn-ghost { background: transparent; color: #111; }
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

    <p class="issue">Issue 001</p>

    <h1 class="hero">RAW<br/>UNFILTERED<br/><span class="truth">TRUTH</span></h1>

    <div class="lead">
      <p>Experimental editorial design for the uncompromising mind. We break grids, challenge conventions, and speak in bold type.</p>
      <p class="feature-num">24<small>FEATURES</small></p>
    </div>

    <div class="actions">
      <a class="btn btn-primary" href="#">Enter the void</a>
      <a class="btn btn-ghost" href="#">Explore</a>
    </div>
  </div>
</body>
</html>`;
