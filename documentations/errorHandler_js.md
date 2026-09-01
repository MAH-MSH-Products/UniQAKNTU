# Error Handler Utility (errorHandler.js) Documentation

## Purpose
`frontend/src/utils/errorHandler.js` extracts, standardizes, and localizes error messages from Axios and Django REST Framework API responses, providing user-friendly feedback in both English and Persian.

## Key Components

### `getErrorMessage(error, fallbackKey)`
- Inspects error response structures:
  - `response.data.detail`
  - `response.data.error`
  - `response.data.non_field_errors`
  - Field error dictionaries (e.g. `{ password: [...] }`)
  - HTTP status fallbacks (401, 403, 404, 500, network errors)
- Returns a clean string localized via `react-i18next`.

## Usage
```javascript
import { getErrorMessage } from '../utils/errorHandler';

try {
  await api.post('/some/endpoint/', data);
} catch (error) {
  const message = getErrorMessage(error, 'errors.default');
  setError(message);
}
```

## Integration
Used across authentication, wiki forms, support tickets, and admin moderation panels.
