# Cloudflare WAF Rules — NetPulse

## Rule 1: Block known bad bots

- **Expression**: `(cf.client.bot) and not (cf.client.bot = "verified")`
- **Action**: Block

## Rule 2: Rate limit login endpoint

- **Expression**: `(http.request.uri.path eq "/auth/login")`
- **Rate**: 10 requests per minute per IP
- **Action**: Block for 60 seconds

## Rule 3: Rate limit API

- **Expression**: `(http.request.uri.path matches "^/posts|^/search|^/categories|^/tags")`
- **Rate**: 60 requests per minute per IP
- **Action**: Challenge

## Rule 4: Block suspicious user agents

- **Expression**: `(http.user_agent contains "sqlmap") or (http.user_agent contains "nikto") or (http.user_agent contains "nmap")`
- **Action**: Block

## Rule 5: Geo-block (optional)

- Adjust based on target audience
