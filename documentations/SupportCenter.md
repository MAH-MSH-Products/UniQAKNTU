# SupportCenter.jsx Documentation

## Purpose
The `SupportCenter.jsx` component provides a user-facing support dashboard for standard users and instructors. It enables users to submit support tickets and view the status of their past tickets with full reply history.

**Phase 6 Update:** This component has been modified to handle non-existent backend endpoints. The "Request Instructor Role" functionality has been replaced with a static notice, and all API calls now use mock data until backend support is added.

This component is part of Phase 6 (Feature Decommissioning & Mock Fallbacks) of the UniQAKNTU project.

## Key Components

### State Management
- **activeTab**: Controls which tab is displayed ('submit' or 'my-tickets')
- **tickets**: Array of user's tickets (currently using mock data)
- **expandedTicket**: ID of the currently expanded ticket to show replies
- **loading**: Boolean indicating loading state
- **formData**: Object containing form fields (title, description, category, introduction)
- **formStatus**: Object for displaying success/error messages

### Functions

#### `fetchUserTickets()`
- **Purpose**: Fetches the current user's tickets from mock data
- **API Endpoint**: `GET /support/tickets/` **[DISABLED - Phase 6]**
- **Returns**: Array of ticket objects with replies (mock data)
- **Status**: Uses mock data only - backend endpoint does not exist

#### `handleSubmit(e)`
- **Purpose**: Handles ticket form submission
- **API Endpoints**: 
  - `POST /support/tickets/` **[DISABLED - Phase 6]** for general support tickets
  - `POST /auth/role-request/` **[DISABLED - Phase 6]** for instructor role requests
- **Validation**: Ensures required fields are filled
- **Phase 6 Update**: Prevents submission for "Request Instructor Role" category with static notice

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
// Phase 6: Route disabled - backend endpoints do not exist
// import SupportCenter from './pages/support/SupportCenter';
// <Route path="/support" element={<SupportCenter />} />
```

### Form Fields

#### General Support Ticket
- **Category**: Dropdown selection (General Support, Technical Issue, Content Error)
- **Title**: Text input (required)
- **Description**: Textarea (required)

#### Instructor Role Request [DISABLED - Phase 6]
When "Request Instructor Role" category is selected, a static notice is displayed:
> **Notice:** Role changes are managed by administrators. Contact support offline.

The introduction field and submission functionality have been removed per Phase 6 requirements.

## Integration

### API Integration Points [DISABLED - Phase 6]

The following API endpoints do not exist in the backend and have been replaced with mock data:

1. **Endpoint 4.2** - `GET /support/tickets/` **[DISABLED]**
   - Previously used in `fetchUserTickets()` to fetch user's tickets
   - Currently using mock data only
   - **Status**: Backend endpoint does not exist

2. **Endpoint 4.1** - `POST /support/tickets/` **[DISABLED]**
   - Previously used in `handleSubmit()` for general support ticket submission
   - Payload: `{ title, description, category }`
   - **Status**: Backend endpoint does not exist

3. **Endpoint 1.2** - `POST /auth/role-request/` **[DISABLED]**
   - Previously used in `handleSubmit()` when category was "Request Instructor Role"
   - Payload: `{ introduction }`
   - **Status**: Backend endpoint does not exist

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
- `api` - From `../../services/api` (imported but not used in Phase 6)

### Styling
- Bootstrap CSS classes for layout and components
- Tailwind CSS compatible structure

## Change Log

- **Phase 6 (2026-08-27)** - Feature Decommissioning & Mock Fallbacks:
  - Removed "Request Instructor Role" from categories array
  - Replaced instructor role request form with static notice
  - All API calls replaced with mock data
  - Updated documentation to reflect disabled endpoints
  - Component serves as placeholder until backend support is added

- **Phase 12 - Route Protection & RBAC UI Enforcement**: 
  - Added authentication check in `useEffect` hook to prevent `fetchUserTickets()` from executing when user is not authenticated
  - This prevents unhandled promise rejections and 401 errors if the component mounts before router redirection
  - Updated documentation to reflect auth-check implementation

- **Initial Creation**: Initial creation of SupportCenter component
  - Implemented tab-based UI for submit tickets and view my tickets
  - Added support for instructor role requests with introduction field
  - Implemented expandable ticket list with reply history
  - Added mock data for development until backend API is ready
