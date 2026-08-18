# SupportCenter.jsx Documentation

## Purpose
The `SupportCenter.jsx` component provides a user-facing support dashboard for standard users and instructors. It enables users to submit support tickets (including instructor role requests) and view the status of their past tickets with full reply history.

This component is part of Phase 6 (UI Implementation - Support & Admin Dashboards) of the UniQAKNTU project.

## Key Components

### State Management
- **activeTab**: Controls which tab is displayed ('submit' or 'my-tickets')
- **tickets**: Array of user's tickets fetched from the API
- **expandedTicket**: ID of the currently expanded ticket to show replies
- **loading**: Boolean indicating loading state
- **formData**: Object containing form fields (title, description, category, introduction)
- **formStatus**: Object for displaying success/error messages

### Functions

#### `fetchUserTickets()`
- **Purpose**: Fetches the current user's tickets from the API
- **API Endpoint**: `GET /support/tickets/` (Endpoint 4.2)
- **Returns**: Array of ticket objects with replies
- **Mock Data**: Uses temporary mock data until backend is ready

#### `handleSubmit(e)`
- **Purpose**: Handles ticket form submission
- **API Endpoints**: 
  - `POST /support/tickets/` (Endpoint 4.1) for general support tickets
  - `POST /auth/role-request/` (Endpoint 1.2) for instructor role requests
- **Validation**: Ensures required fields are filled and introduction is provided for role requests

#### `handleInputChange(e)`
- **Purpose**: Updates form data state when user types in form fields
- **Parameters**: React synthetic event object

#### `toggleTicketExpand(ticketId)`
- **Purpose**: Toggles the expanded/collapsed state of a ticket to show/hide replies
- **Parameters**: `ticketId` - The ID of the ticket to toggle

## Usage

### Component Props
This component does not accept any props. It is designed to be used as a standalone page component.

### Integration in App.jsx
```jsx
import SupportCenter from './pages/support/SupportCenter';

// In your routes:
<Route path="/support" element={<SupportCenter />} />
```

### Form Fields

#### General Support Ticket
- **Category**: Dropdown selection (General Support, Technical Issue, Content Error, Request Instructor Role)
- **Title**: Text input (required)
- **Description**: Textarea (required)

#### Instructor Role Request
When "Request Instructor Role" category is selected:
- **Introduction**: Textarea (required) - User explains their qualifications and reasons for requesting instructor access

## Integration

### API Integration Points (باید چک شود)

The following API endpoints need to be verified and integrated when the backend is ready:

1. **Endpoint 4.2** - `GET /support/tickets/`
   - Used in `fetchUserTickets()` to fetch user's tickets
   - Currently using mock data
   - **Tag**: باید چک شود

2. **Endpoint 4.1** - `POST /support/tickets/`
   - Used in `handleSubmit()` for general support ticket submission
   - Payload: `{ title, description, category }`
   - **Tag**: باید چک شود

3. **Endpoint 1.2** - `POST /auth/role-request/`
   - Used in `handleSubmit()` when category is "Request Instructor Role"
   - Payload: `{ introduction }`
   - **Tag**: باید چک شود

### Mock Data Structure
```javascript
const mockTickets = [
  {
    id: 1,
    title: 'Cannot upload PDF',
    description: 'I get a 500 error when attaching a PDF.',
    category: 'Technical Issue',
    status: 'Open',
    created_at: '2026-08-15T10:30:00Z',
    replies: [
      {
        id: 1,
        user: 'admin',
        message: 'We are looking into this issue.',
        created_at: '2026-08-15T12:00:00Z'
      }
    ]
  }
];
```

## Dependencies

### React Hooks
- `useState` - For managing component state
- `useEffect` - For fetching tickets on component mount

### Custom Hooks
- `useAuth` - From `../../context/AuthContext` for accessing user context

### Services
- `api` - From `../../services/api` for making HTTP requests (currently mocked)

### Styling
- Bootstrap CSS classes for layout and components
- Tailwind CSS compatible structure

## Change Log

- **2026-08-17**: Initial creation of SupportCenter component for Phase 6
  - Implemented tab-based UI for submit tickets and view my tickets
  - Added support for instructor role requests with introduction field
  - Implemented expandable ticket list with reply history
  - Added mock data for development until backend API is ready
  - Marked API integration points with "باید چک شود" tag
