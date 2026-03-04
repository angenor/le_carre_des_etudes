const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|mediapartners|googlebot|bingbot|yandexbot|baiduspider|duckduckbot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|gptbot|claude-web|anthropic-ai|chatgpt|wget|curl|httpie|python-requests|node-fetch|axios|undici|headlesschrome|phantomjs|puppeteer|playwright|selenium/i

export function isBot(userAgent: string | undefined | null): boolean {
  if (!userAgent) return true
  return BOT_PATTERN.test(userAgent)
}
