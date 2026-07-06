// GET /api-docs — interactive Swagger UI for the Pawlink API.
// Served as a route handler (not a page) so it needs no root layout and
// cannot conflict with the frontend branch. Spec lives at /openapi.yaml.
const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pawlink API — Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
    integrity="sha384-+yyzNgM3K92sROwsXxYCxaiLWxWJ0G+v/9A+qIZ2rgefKgkdcmJI+L601cqPD/Ut"
    crossorigin="anonymous" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
    integrity="sha384-qn5tagrAjZi8cSmvZ+k3zk4+eDEEUcP9myuR2J6V+/H6rne++v6ChO7EeHAEzqxQ"
    crossorigin="anonymous"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        tryItOutEnabled: true,
      })
    }
  </script>
</body>
</html>`

export function GET(): Response {
  return new Response(SWAGGER_HTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
