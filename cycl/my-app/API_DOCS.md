# API Documentation

This document covers only public `/api/**` routes that are safe for client consumption.

## Base URL

- Local: `http://localhost:3000`

## Public Endpoints

### GET /api/home/hero

Returns the currently active hero section for the homepage.

- Authentication: Not required
- Method: `GET`
- Success response: `200 OK`

Example response:

```json
{
  "_id": "...",
  "title": "Homepage Hero",
  "slides": [
    {
      "title": "Welcome",
      "subtitle": "Intro text",
      "imageUrl": "https://res.cloudinary.com/...",
      "imagePublicId": "hero/abc123",
      "ctaText": "Learn More",
      "ctaLink": "/contact"
    }
  ],
  "isActive": true,
  "createdAt": "2026-04-26T00:00:00.000Z",
  "updatedAt": "2026-04-26T00:00:00.000Z"
}
```

If no active hero exists:

```json
null
```

### GET /api/home/contact

Returns the currently active contact details.

- Authentication: Not required
- Method: `GET`
- Success response: `200 OK`

Example response:

```json
{
  "_id": "...",
  "phone": {
    "text": "+977 9864379436",
    "link": "callto:+9779864379436"
  },
  "email": {
    "text": "bishow8848@gmail.com",
    "link": "mailto:bishow8848@gmail.com"
  },
  "facebook": {
    "text": "CYCL",
    "link": "https://www.facebook.com/"
  },
  "whatsapp": {
    "text": "+9779864379436",
    "link": "https://web.whatsapp.com/"
  },
  "location": {
    "text": "Kathmandu, Nepal",
    "link": "https://maps.app.goo.gl/z2aRNvaYfqvM2U5t7"
  },
  "isActive": true,
  "createdAt": "2026-04-26T00:00:00.000Z",
  "updatedAt": "2026-04-26T00:00:00.000Z"
}
```

If no active contact exists:

```json
null
```

## Authorization Model

- Public routes (`/api/home/*`) are read-only (`GET` only).
- Mutating operations (`POST`, `PUT`, `DELETE`) are intentionally kept under admin routes.