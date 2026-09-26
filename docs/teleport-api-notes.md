# Teleport API — Spike Notes (Day 1)

Base URL: `https://api.teleport.org/api`
Auth: **none required**, it's a fully open/public API.
Style: HATEOAS — most responses give you `_links` to follow rather than IDs to
construct yourself. This means fetching one city's full profile is a **chain
of requests**, not a single call.

⚠️ **Caveat:** Teleport's `robots.txt` blocked my automated fetch attempt, so
the shapes below are reconstructed from Teleport's own published code
examples plus two open-source wrappers (Python and R) that consume this API.
They agree with each other. **Whoever wires up the live fetch in Day 4:
verify field names in a browser or Postman against a real city first.**

## The request chain

1. **Search for a city** → `GET /cities/?search={query}`
2. **Fetch the city** → follow `city:item` link → get `city:urban_area` link
3. **Fetch the urban area** → get `ua:scores` / `ua:images` links
4. **Fetch scores + images in parallel**

## 1. Search response (`/cities/?search=dublin`)

\`\`\`json
{
  "_embedded": {
    "city:search-results": [
      {
        "matching_full_name": "Dublin, Ireland",
        "_links": {
          "city:item": { "href": "https://api.teleport.org/api/cities/geonameid:2964574/" }
        }
      }
    ]
  }
}
\`\`\`

## 2. City response

\`\`\`json
{
  "name": "Dublin",
  "full_name": "Dublin, Ireland",
  "geoname_id": 2964574,
  "_links": {
    "city:urban_area": { "href": "https://api.teleport.org/api/urban_areas/slug:dublin/" }
  }
}
\`\`\`

Not every city has an urban area — handle a missing `city:urban_area` link as
"no liveability data available."

## 3. Urban area response

\`\`\`json
{
  "name": "Dublin",
  "full_name": "Dublin, Ireland",
  "_links": {
    "ua:scores": { "href": ".../urban_areas/slug:dublin/scores/" },
    "ua:images": { "href": ".../urban_areas/slug:dublin/images/" },
    "ua:details": { "href": ".../urban_areas/slug:dublin/details/" }
  }
}
\`\`\`

## 4a. Scores response — our 17-metric dashboard data

\`\`\`json
{
  "name": "Dublin",
  "teleport_city_score": 66.4,
  "categories": [
    { "id": "HOUSING", "name": "Housing", "score_out_of_10": 1.0 },
    { "id": "COST_OF_LIVING", "name": "Cost of Living", "score_out_of_10": 2.34 },
    { "id": "STARTUPS", "name": "Startups", "score_out_of_10": 10.0 },
    { "id": "VENTURE_CAPITAL", "name": "Venture Capital", "score_out_of_10": 10.0 },
    { "id": "TRAVEL_CONNECTIVITY", "name": "Travel Connectivity", "score_out_of_10": 6.68 },
    { "id": "COMMUTE", "name": "Commute", "score_out_of_10": 5.52 },
    { "id": "BUSINESS_FREEDOM", "name": "Business Freedom", "score_out_of_10": 8.67 },
    { "id": "SAFETY", "name": "Safety", "score_out_of_10": 7.02 },
    { "id": "HEALTHCARE", "name": "Healthcare", "score_out_of_10": 8.50 },
    { "id": "EDUCATION", "name": "Education", "score_out_of_10": 8.09 },
    { "id": "ENVIRONMENTAL_QUALITY", "name": "Environmental Quality", "score_out_of_10": 5.23 },
    { "id": "ECONOMY", "name": "Economy", "score_out_of_10": 6.51 },
    { "id": "TAXATION", "name": "Taxation", "score_out_of_10": 3.92 },
    { "id": "INTERNET_ACCESS", "name": "Internet Access", "score_out_of_10": 7.10 },
    { "id": "LEISURE_CULTURE", "name": "Leisure & Culture", "score_out_of_10": 10.0 },
    { "id": "TOLERANCE", "name": "Tolerance", "score_out_of_10": 6.71 },
    { "id": "OUTDOORS", "name": "Outdoors", "score_out_of_10": 5.75 }
  ]
}
\`\`\`

That's the confirmed 17-metric list the blueprint calls for.

## 4b. Images response

\`\`\`json
{
  "photos": [
    {
      "image": { "mobile": "https://media.teleport.org/.../mobile.jpg", "web": "https://media.teleport.org/.../web.jpg" },
      "attribution": "Photo by ... on Unsplash"
    }
  ]
}
\`\`\`

Always display `attribution` near the image (Unsplash license requirement).

## Known quirks / gotchas

- **No API key, but it does rate-limit** by IP → `429`. Threshold unconfirmed
  — code defensively (debounce search, cache urban-area lookups per session,
  treat 429 as its own UI state).
- Not every searched city resolves to an urban area — need a "limited data"
  state, not just loading/error/success.
- API fields are `snake_case`; component props stay `camelCase` —
  `services/api.js` owns that translation.

## What `services/api.js` returns to components

`getCityDetail()` returns one flattened, camelCase object — see
`services/mockData.js` for the exact shape to build against.