exports.handler = async function(event, context) {
  const RSS_URL = 'https://news.google.com/rss/search?q=soja+agro+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419';

  try {
    const res = await fetch(RSS_URL);
    if (!res.ok) throw new Error('RSS fetch failed: ' + res.status);
    const xml = await res.text();

    // Parse XML manually (no DOM in serverless)
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 12) {
      const block = match[1];
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/) || [])[1] || (block.match(/<title>(.*?)<\/title>/) || [])[1] || '';
      const link = (block.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      const source = (block.match(/<source[^>]*>(.*?)<\/source>/) || [])[1] || '';
      const desc = (block.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/) || [])[1] || '';

      items.push({ title: cleanHtml(title), link, pubDate, source: cleanHtml(source), description: cleanHtml(desc) });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800'
      },
      body: JSON.stringify({ status: 'ok', items })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ status: 'error', message: e.message })
    };
  }
};

function cleanHtml(str) {
  return (str || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
