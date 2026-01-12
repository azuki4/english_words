// Cloudflare Worker: jisho.org API Proxy
// このスクリプトをCloudflare Workersにデプロイしてください

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // CORSプリフライトリクエストに対応
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  // URLパラメータから検索キーワードを取得
  const url = new URL(request.url)
  const keyword = url.searchParams.get('keyword')

  if (!keyword) {
    return new Response(JSON.stringify({ error: 'keyword parameter is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }

  try {
    // jisho.org APIにリクエスト
    const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`
    const response = await fetch(jishoUrl)
    const data = await response.json()

    // CORSヘッダーを追加してレスポンスを返す
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}
