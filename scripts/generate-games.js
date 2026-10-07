const fs = require("fs");
const path = require("path");

const BASE_URL = "https://mon-site-jeux-dqxm.vercel.app";
const FEED_URL =
  "https://gamemonetize.com/feed.php?format=0&num=50&page=";

const TOTAL_PAGES = 10;
const GAMES_PER_PAGE = 50;

const gamesDir = path.join(process.cwd(), "games");
const manifestPath = path.join(gamesDir, "_generated.json");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slugify(text) {
  return String(text || "game")
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
    game.gameTitle ||
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
    game.game_link ||
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
    game.thumbnail_url ||
    ""
  );
}

function getDescription(game, title) {
  const description =
    game.description ||
    game.desc ||
    game.summary ||
    "";

  if (description) {
    return description;
  }

  return `Play ${title} online for free on ArcadePulse. Enjoy this browser game instantly with no download required.`;
}

function validUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

async function getGames() {
  const allGames = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = `${FEED_URL}${page}`;

    console.log(
      `Downloading GameMonetize page ${page}/${TOTAL_PAGES}...`
    );

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "ArcadePulse Game Generator"
        }
      });

      if (!response.ok) {
        console.log(
          `Page ${page} returned HTTP ${response.status}`
        );
        continue;
      }

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch (error) {
        console.log(
          `Page ${page} did not return valid JSON.`
        );
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

      console.log(
        `Found ${games.length} games on page ${page}.`
      );

      allGames.push(...games);

    } catch (error) {
      console.log(
        `Error while downloading page ${page}: ${error.message}`
      );
    }
  }

  return allGames;
}

function createGameHtml(game, slug) {
  const title = getTitle(game);
  const gameUrl = validUrl(getGameUrl(game));
  const thumbnail = validUrl(getThumbnail(game));
  const description = getDescription(game, title);

  if (!gameUrl) {
    return null;
  }

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeGameUrl = escapeHtml(gameUrl);
  const safeThumbnail = escapeHtml(thumbnail);

  const image = thumbnail
    ? `
      <img
        src="${safeThumbnail}"
        alt="${safeTitle}"
        class="game-image"
        loading="lazy"
      >
    `
    : "";

  const canonical =
    `${BASE_URL}/games/${slug}.html`;

  return `<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>
${safeTitle} - Play Free Online | ArcadePulse
</title>

<meta
  name="description"
  content="${safeDescription}"
>

<meta
  name="robots"
  content="index, follow"
>

<link
  rel="canonical"
  href="${canonical}"
>

<meta
  property="og:title"
  content="${safeTitle} - ArcadePulse"
>

<meta
  property="og:description"
  content="${safeDescription}"
>

<meta
  property="og:url"
  content="${canonical}"
>

<meta
  property="og:type"
  content="website"
>

${
  thumbnail
    ? `
<meta
  property="og:image"
  content="${safeThumbnail}"
>
`
    : ""
}

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #071426;
  color: #ffffff;
  font-family: Arial, sans-serif;
}

header {
  background: #0b1d35;
  border-bottom: 1px solid #1b3557;
  padding: 20px;
  text-align: center;
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
  margin-bottom: 15px;
}

.description {
  max-width: 850px;
  margin: 0 auto 25px;
  color: #b8c7d9;
  text-align: center;
  line-height: 1.6;
}

.game-image {
  display: block;
  width: 100%;
  max-width: 400px;
  margin: 0 auto 25px;
  border-radius: 12px;
}

.game-container {
  background: #0b1d35;
  border: 1px solid #1b3557;
  border-radius: 12px;
  padding: 15px;
}

iframe {
  display: block;
  width: 100%;
  height: 650px;
  border: 0;
  border-radius: 8px;
  background: #000000;
}

.back {
  display: inline-block;
  margin-top: 25px;
  color: #4da3ff;
  text-decoration: none;
}

.back:hover {
  text-decoration: underline;
}

footer {
  padding: 30px;
  text-align: center;
  color: #8294aa;
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
  "url": ${JSON.stringify(canonical)}
}
</script>

</head>

<body>

<header>

<a href="${BASE_URL}/">
ArcadePulse
</a>

</header>

<main>

<h1>
${safeTitle}
</h1>

<p class="description">
${safeDescription}
</p>

${image}

<div class="game-container">

<iframe
  src="${safeGameUrl}"
  title="${safeTitle}"
  allowfullscreen
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade">
</iframe>

</div>

<a
  class="back"
  href="${BASE_URL}/"
>
← Back to all free online games
</a>

</main>

<footer>

© ${new Date().getFullYear()}
ArcadePulse — Free Online Games

</footer>

</body>

</html>
`;
}

function createGamesIndex(games) {
  const list = games
    .map(
      game => `
<li>
  <a href="/games/${game.slug}.html">
    ${escapeHtml(game.title)}
  </a>
</li>
`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>
All Free Online Games | ArcadePulse
</title>

<meta
  name="description"
  content="Browse and play free online games on ArcadePulse."
>

<meta
  name="robots"
  content="index, follow"
>

<link
  rel="canonical"
  href="${BASE_URL}/games/"
>

<style>

body {
  background: #071426;
  color: white;
  font-family: Arial, sans-serif;
  max-width: 1000px;
  margin: auto;
  padding: 30px;
}

a {
  color: #4da3ff;
}

li {
  margin: 10px 0;
}

</style>

</head>

<body>

<h1>
All Free Online Games
</h1>

<p>
Browse and play free online games on ArcadePulse.
</p>

<ul>

${list}

</ul>

</body>

</html>`;
}

function createSitemap(games) {
  const urls = [];

  urls.push(`
<url>
  <loc>${BASE_URL}/</loc>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
</url>
`);

  urls.push(`
<url>
  <loc>${BASE_URL}/games/</loc>
  <changefreq>daily</changefreq>
  <priority>0.8</priority>
</url>
`);

  for (const game of games) {
    urls.push(`
<url>
  <loc>${BASE_URL}/games/${game.slug}.html</loc>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>
`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>

<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>

${urls.join("")}

</urlset>
`;
}

async function main() {

  console.log("");
  console.log("====================================");
  console.log(" ArcadePulse SEO Game Generator");
  console.log("====================================");
  console.log("");

  fs.mkdirSync(gamesDir, {
    recursive: true
  });

  // Remove ONLY files created by this generator previously.
  if (fs.existsSync(manifestPath)) {

    try {

      const oldFiles = JSON.parse(
        fs.readFileSync(
          manifestPath,
          "utf8"
        )
      );

      for (const filename of oldFiles) {

        const filePath =
          path.join(
            gamesDir,
            filename
          );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

      }

    } catch (error) {

      console.log(
        "Previous manifest could not be read."
      );

    }
  }

  const rawGames =
    await getGames();

  console.log("");
  console.log(
    `Total games received: ${rawGames.length}`
  );

  const usedSlugs =
    new Set();

  const generatedGames =
    [];

  for (const game of rawGames) {

    const title =
      getTitle(game);

    const gameUrl =
      validUrl(
        getGameUrl(game)
      );

    if (!title || !gameUrl) {
      continue;
    }

    let baseSlug =
      slugify(title);

    let slug =
      baseSlug;

    let number = 2;

    while (
      usedSlugs.has(slug)
    ) {

      slug =
        `${baseSlug}-${number}`;

      number++;

    }

    usedSlugs.add(slug);

    const html =
      createGameHtml(
        game,
        slug
      );

    if (!html) {
      continue;
    }

    const filename =
      `${slug}.html`;

    fs.writeFileSync(
      path.join(
        gamesDir,
        filename
      ),
      html,
      "utf8"
    );

    generatedGames.push({
      title: title,
      slug: slug,
      filename: filename
    });

  }

  // Save list of generated files.
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      generatedGames.map(
        game => game.filename
      ),
      null,
      2
    ),
    "utf8"
  );

  // Create the games directory index.
  fs.writeFileSync(
    path.join(
      gamesDir,
      "index.html"
    ),
    createGamesIndex(
      generatedGames
    ),
    "utf8"
  );

  // Update sitemap.xml.
  fs.writeFileSync(
    path.join(
      process.cwd(),
      "sitemap.xml"
    ),
    createSitemap(
      generatedGames
    ),
    "utf8"
  );

  console.log("");
  console.log("====================================");
  console.log(
    `Generated pages: ${generatedGames.length}`
  );
  console.log("Sitemap updated.");
  console.log("====================================");
  console.log("");

}

main().catch(error => {

  console.error("");
  console.error(
    "GENERATION FAILED:"
  );
  console.error(
    error
  );
  console.error("");

  process.exit(1);

});
