const fs = require("fs");
const path = require("path");

const BASE_URL = "https://mon-site-jeux-dqxm.vercel.app";
const FEED_URL = "https://gamemonetize.com/feed.php?format=0&num=50&page=";

const TOTAL_PAGES = 10; // 10 × 50 = jusqu'à 500 jeux

const gamesDir = path.join(process.cwd(), "games");
const manifestFile = path.join(gamesDir, "_generated.json");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slugify(text) {
  return String(text ?? "game")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80) || "game";
}

function getTitle(game) {
  return (
    game.title ||
    game.name ||
    game.game_name ||
    "Free Online Game"
  );
}

function getGameUrl(game) {
  return (
    game.url ||
    game.game_url ||
    game.gameurl ||
    game.link ||
    game.play_url ||
    ""
  );
}

function getThumbnail(game) {
  return (
    game.thumb ||
    game.thumbnail ||
    game.image ||
    game.image_url ||
    game.thumb_url ||
    ""
  );
}

function getDescription(game, title) {
  return (
    game.description ||
    game.desc ||
    `Play ${title} online for free on ArcadePulse. Enjoy this game directly in your browser with no download required.`
  );
}

function cleanUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }

    return parsed.href;
  } catch {
    return "";
  }
}

async function fetchGames() {
  const allGames = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    try {
      console.log(`Fetching GameMonetize page ${page}/${TOTAL_PAGES}...`);

      const response = await fetch(`${FEED_URL}${page}`);

      if (!response.ok) {
        console.log(`Page ${page} failed: HTTP ${response.status}`);
        continue;
      }

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        console.log(`Page ${page}: invalid JSON`);
        continue;
      }

      let games = [];

      if (Array.isArray(data)) {
        games = data;
      } else if (Array.isArray(data.games)) {
        games = data.games;
      } else if (Array.isArray(data.data)) {
        games = data.data;
      } else if (Array.isArray(data.items)) {
        games = data.items;
      }

      console.log(`Page ${page}: ${games.length} games`);

      allGames.push(...games);
    } catch (error) {
      console.log(`Error on page ${page}:`, error.message);
    }
  }

  return allGames;
}

function createGamePage(game, slug) {
  const title = getTitle(game);
  const gameUrl = cleanUrl(getGameUrl(game));
  const thumbnail = cleanUrl(getThumbnail(game));
  const description = getDescription(game, title);

  if (!gameUrl) {
    return null;
  }

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeGameUrl = escapeHtml(gameUrl);
  const safeThumbnail = escapeHtml(thumbnail);

  const imageHtml = thumbnail
    ? `
      <img
        src="${safeThumbnail}"
        alt="${safeTitle}"
        class="game-image"
        loading="lazy"
      >
    `
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${safeTitle} - Play Free Online | ArcadePulse</title>

  <meta
    name="description"
    content="${safeDescription}"
  >

  <meta name="robots" content="index, follow">

  <link
    rel="canonical"
    href="${BASE_URL}/games/${slug}.html"
  >

  <meta
    property="og:title"
    content="${safeTitle} - ArcadePulse"
  >

  <meta
    property="og:description"
    content="${safeDescription}"
  >

  ${
    thumbnail
      ? `<meta property="og:image" content="${safeThumbnail}">`
      : ""
  }

  <meta
    property="og:url"
    content="${BASE_URL}/games/${slug}.html"
  >

  <meta property="og:type" content="website">

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #071426;
      color: #ffffff;
    }

    header {
      background: #0b1d35;
      padding: 20px;
      text-align: center;
      border-bottom: 1px solid #1b3557;
    }

    header a {
      color: #4da3ff;
      text-decoration: none;
      font-size: 28px;
      font-weight: bold;
    }

    main {
      max-width: 1200px;
      margin: auto;
      padding: 25px 15px 60px;
    }

    h1 {
      text-align: center;
      font-size: 32px;
      margin-bottom: 10px;
    }

    .description {
      max-width: 800px;
      margin: 0 auto 25px;
      text-align: center;
      color: #b8c7d9;
      line-height: 1.6;
    }

    .game-container {
      background: #0b1d35;
      border: 1px solid #1b3557;
      border-radius: 12px;
      padding: 15px;
      overflow: hidden;
    }

    iframe {
      width: 100%;
      height: 650px;
      border: 0;
      border-radius: 8px;
      background: #000;
    }

    .game-image {
      display: block;
      max-width: 300px;
      width: 100%;
      margin: 0 auto 20px;
      border-radius: 10px;
    }

    .back {
      display: inline-block;
      margin-top: 20px;
      color: #4da3ff;
      text-decoration: none;
    }

    .back:hover {
      text-decoration: underline;
    }

    footer {
      text-align: center;
      color: #8294aa;
      padding: 30px;
      border-top: 1px solid #1b3557;
    }

    @media (max-width: 700px) {
      h1 {
        font-size: 25px;
      }

      iframe {
        height: 500px;
      }
    }
  </style>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": ${JSON.stringify(title)},
    "description": ${JSON.stringify(description)},
    "url": ${JSON.stringify(`${BASE_URL}/games/${slug}.html`)}
  }
  </script>

</head>

<body>

<header>
  <a href="${BASE_URL}/">ArcadePulse</a>
</header>

<main>

  <h1>${safeTitle}</h1>

  <p class="description">
    ${safeDescription}
  </p>

  ${imageHtml}

  <div class="game-container">

    <iframe
      src="${safeGameUrl}"
      title="${safeTitle}"
      allowfullscreen
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade">
    </iframe>

  </div>

  <a class="back" href="${BASE_URL}/">
    ← Back to all free online games
  </a>

</main>

<footer>
  © ${new Date().getFullYear()} ArcadePulse — Free Online Games
</footer>

</body>
</html>
`;
}

function createGamesIndex(games) {
  const cards = games
    .map(
      game => `
        <li>
          <a href="/games/${game.slug}.html">
            ${escapeHtml(game.title)}
          </a>
        </li>
      `
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>All Games - ArcadePulse</title>
<meta name="description" content="Browse free online games on ArcadePulse.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${BASE_URL}/games/">
<style>
body {
  background:#071426;
  color:white;
  font-family:Arial,sans-serif;
  max-width:1000px;
  margin:auto;
  padding:30px;
}
a {
  color:#4da3ff;
}
li {
  margin:10px 0;
}
</style>
</head>
<body>
<h1>All Free Online Games</h1>
<p>Browse and play free online games on ArcadePulse.</p>
<ul>
${cards}
</ul>
</body>
</html>`;
}

async function main() {
  console.log("Starting ArcadePulse game generator...");

  fs.mkdirSync(gamesDir, { recursive: true });

  // Remove only pages created by the previous generator run.
  if (fs.existsSync(manifestFile)) {
    try {
      const oldFiles = JSON.parse(
        fs.readFileSync(manifestFile, "utf8")
      );

      for (const file of oldFiles) {
        const filePath = path.join(gamesDir, file);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch {
      console.log("Could not read previous manifest.");
    }
  }

  const rawGames = await fetchGames();

  const usedSlugs = new Set();
  const generatedGames = [];

  for (const game of rawGames) {
    const title = getTitle(game);
    const gameUrl = cleanUrl(getGameUrl(game));

    if (!title || !gameUrl) {
      continue;
    }

    let baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 2;

    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    usedSlugs.add(slug);

    const html = createGamePage(game, slug);

    if (!html) {
      continue;
    }

    const filename = `${slug}.html`;

    fs.writeFileSync(
      path.join(gamesDir, filename),
      html,
      "utf8"
    );

    generatedGames.push({
      title,
      slug,
      filename
    });
  }

  const manifest = generatedGames.map(game => game.filename);

  fs.writeFileSync(
    manifestFile,
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  // Create games index
  fs.writeFileSync(
    path.join(gamesDir, "index.html"),
    createGamesIndex(generatedGames),
    "utf8"
  );

  // Create sitemap
  const urls = [
    `
    <url>
      <loc>${BASE_URL}/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    `,
    `
    <url>
      <loc>${BASE_URL}/games/</loc>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>
    `
  ];

  for (const game of generatedGames) {
    urls.push(`
    <url>
      <loc>${BASE_URL}/games/${game.slug}.html</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>
    `);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  fs.writeFileSync(
    path.join(process.cwd(), "sitemap.xml"),
    sitemap,
    "utf8"
  );

  console.log("");
  console.log("=================================");
  console.log(`Generated ${generatedGames.length} game pages`);
  console.log("Sitemap updated");
  console.log("=================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
