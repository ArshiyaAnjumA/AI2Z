# API Contract

## Base URL
Local: `http://127.0.0.1:8000`

## Endpoints

### Health
`GET /health`
- **Description**: Checks service health.
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "backend"
  }
  ```

### Authentication
(Managed via Supabase Auth on client side)

### Tracks (Upcoming)
`GET /tracks`
- Returns list of learning tracks.

### Lessons (Upcoming)
`GET /lessons/{id}`
- Returns lesson content.
