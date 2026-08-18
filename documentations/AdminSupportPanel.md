# AdminSupportPanel.jsx Documentation

## Purpose
The `AdminSupportPanel.jsx` component provides a dedicated admin dashboard for managing all system tickets and content reports in the UniQAKNTU platform. This component is strictly accessible only to users with `is_staff === true` and includes built-in access control that renders a 403 Forbidden page for unauthorized users.

This component is part of Phase 6 (UI Implementation - Support & Admin Dashboards) of the UniQAKNTU project.

## Key Components

### Access Control
- **Staff Verification**: Uses the `useAuth` hook to check if `user.is_staff === true`
- **403 Page**: Renders an access denied message for non-staff users

### State Management
- **activeTab**: Controls which tab is displayed ('tickets' or 'reports')
- **items**: Array of tickets or reports fetched from the API
- **loading**: Boolean indicating loading state
- **selectedItem**: Currently selected item for detailed view in modal
- **replyMessage**: Text input for admin reply to tickets
- **replyStatus**: Object for displaying reply submission feedback

### Props
This component does not accept any props. It is designed to be used as a standalone page component.

### Functions

#### `fetchItems()`
- **Purpose**: Fetches all tickets or reports based on active tab
- **API Endpoint**: `GET /support/admin/tickets/` (Endpoint 4.3)
- **Returns**: Array of ticket or report objects
- **Mock Data**: Uses temporary mock data until backend is ready

#### `handleOpenItem(item)`
- **Purpose**: Opens the detail modal for a specific ticket or report
- **Parameters**: `item` - The ticket or report object to display
- **Actions**: Sets selectedItem state and resets reply form

#### `handleCloseModal()`
- **Purpose**: Closes the detail modal
- **Actions**: Clears selectedItem state

#### `handleReplySubmit(e)`
- **Purpose**: Submits a reply to a support ticket
- **API Endpoint**: `POST /support/tickets/{ticket_id}/reply/` (Endpoint 4.4)
- **Payload Structure**:
  ```javascript
  {
    message: replyMessage
  }
  ```
- **Validation**: Ensures reply message is not empty
- **Mock Data**: Uses temporary mock data until backend is ready

#### `getStatusBadgeClass(status)`
- **Purpose**: Returns appropriate Bootstrap badge class based on status
- **Parameters**: `status` - Status string (Open, Closed, In-progress, etc.)
- **Returns**: Bootstrap class string (e.g., 'bg-success', 'bg-warning')

## Usage

### Component Integration in App.jsx
```jsx
import AdminSupportPanel from './pages/admin/AdminSupportPanel';

// In your routes:
<Route path="/admin/support" element={<AdminSupportPanel />} />
```

### Access Control Example
If a non-staff user attempts to access this page:
```jsx
// Component renders:
<div className="container-fluid py-5">
  <h1 className="display-1 text-danger">403</h1>
  <h2>Access Denied</h2>
  <p>You do not have permission to access the admin support panel.</p>
  <a href="/" className="btn btn-primary">Return to Home</a>
</div>
```

## Data Tables

### Tickets Tab Columns
| Column | Description |
|--------|-------------|
| ID | Ticket ID number |
| User | Username of ticket creator |
| Title | Ticket title |
| Category | Ticket category (Technical Issue, Content Error, etc.) |
| Status | Current status with badge styling |
| Created At | Date ticket was created |
| Action | "View" button to open detail modal |

### Reports Tab Columns
| Column | Description |
|--------|-------------|
| ID | Report ID number |
| User | Username of report creator |
| Question/Answer | Reference to reported content |
| Category | Always shows "Report" |
| Status | Current status with badge styling |
| Created At | Date report was created |
| Action | "View" button to open detail modal |

## Integration

### API Integration Points (باید چک شود)

The following API endpoints need to be verified and integrated when the backend is ready:

1. **Endpoint 4.3** - `GET /support/admin/tickets/`
   - Used in `fetchItems()` to fetch all tickets and reports
   - Requires `is_staff = true` authentication
   - Currently using mock data
   - **Tag**: باید چک شود

2. **Endpoint 4.4** - `POST /support/tickets/{ticket_id}/reply/`
   - Used in `handleReplySubmit()` to submit admin replies
   - Payload: `{ message }`
   - URL parameter: `ticket_id`
   - Currently using mock data with console.log
   - **Tag**: باید چک شود

### Mock Data Structures

#### Tickets Mock Data
```javascript
const mockTickets = [
  {
    id: 1,
    user: { username: 'student_01', id: 5 },
    title: 'Cannot upload PDF',
    description: 'I get a 500 error when attaching a PDF.',
    category: 'Technical Issue',
    status: 'Open',
    created_at: '2026-08-15T10:30:00Z',
    replies: []
  }
];
```

#### Reports Mock Data
```javascript
const mockReports = [
  {
    id: 101,
    user: { username: 'student_02', id: 6 },
    question_id: 105,
    answer_id: 42,
    reason: 'The final formula in the PDF is incorrect.',
    status: 'Pending',
    created_at: '2026-08-16T09:00:00Z'
  }
];
```

### Actual API Calls (When Backend Ready)

#### Fetch Items
```javascript
const response = await api.get('/support/admin/tickets/');
setItems(response.data);
```

#### Submit Reply
```javascript
const response = await api.post(
  `/support/tickets/${selectedItem.id}/reply/`,
  { message: replyMessage }
);
```

## Styling

### Bootstrap Classes Used
- **Layout**: `container-fluid`, `row`, `col-12`, `col-md-6`
- **Navigation**: `nav`, `nav-tabs`, `nav-link`, `active`
- **Cards**: `card`, `card-body`
- **Tables**: `table`, `table-hover`, `table-responsive`, `table-light`, `align-middle`
- **Badges**: `badge`, `bg-success`, `bg-warning`, `bg-secondary`, `bg-info`
- **Modals**: `modal-backdrop`, `modal-dialog`, `modal-content`, `modal-header`, `modal-body`, `modal-footer`, `modal-lg`
- **Buttons**: `btn`, `btn-primary`, `btn-secondary`, `btn-outline-primary`, `btn-sm`, `btn-close`
- **Forms**: `form-control`, `form-label`
- **Alerts**: `alert`, `alert-success`, `alert-danger`, `alert-info`
- **Utilities**: `text-center`, `text-muted`, `border-top`, `border-bottom`, `rounded`, `bg-light`, `d-flex`, `justify-content-between`

### Custom Styles
- Inline `zIndex` styles for modal layering
- Inline `width` style for table header cells

## Dependencies

### React Hooks
- `useState` - For managing component state
- `useEffect` - For fetching items on mount and tab changes

### Custom Hooks
- `useAuth` - From `../../context/AuthContext` for accessing user context and staff verification

### Services
- `api` - From `../../services/api` for making HTTP requests (currently mocked)

## Security Considerations

1. **Client-Side Check**: The component checks `user.is_staff` before rendering
2. **Server-Side Verification Required**: The backend API must also verify `is_staff` status (marked as باید چک شود)
3. **403 Response Handling**: Non-staff users see a clear access denied message

## Change Log

- **2026-08-17**: Initial creation of AdminSupportPanel component for Phase 6
  - Implemented staff-only access control with 403 page
  - Created tab-based UI for tickets and reports
  - Built data grid table with sortable columns
  - Implemented detail modal with full ticket/report information
  - Added reply functionality for tickets
  - Integrated mock data for development
  - Marked API integration points with "باید چک شود" tag
