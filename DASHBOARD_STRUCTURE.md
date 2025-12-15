# Dashboard Structure & Component Hierarchy

## Overview

The dashboard has been redesigned with a modern 3-column layout:
- **Left Sidebar**: Navigation and user info
- **Center Main Content**: Home/Explore/Profile views
- **Right Context Panel**: Top users, recent deeds, inspiration (hidden on mobile)

## Component Structure

```
Dashboard.jsx (Main Container)
├── Sidebar.jsx (Navigation)
├── Dashboard Main Content
│   ├── HomeFeed.jsx (Default view)
│   ├── ExplorePage.jsx (Discover posts)
│   └── ProfilePage.jsx (User profile)
├── ContextPanel.jsx (Right sidebar - optional)
└── UploadModal.jsx (Upload overlay)
```

## Components

### 1. Sidebar.jsx
**Location:** `src/components/Sidebar.jsx`

**Features:**
- App logo and tagline
- User avatar and aura score display
- Navigation buttons:
  - Home (feed)
  - Explore
  - Profile
  - Upload Good Deed (opens modal)
  - Logout

**Props:**
- `user`: Current user object
- `profile`: User profile data
- `totalAuraPoints`: Calculated aura points
- `currentView`: Active view ('home', 'explore', 'profile')
- `onViewChange`: Callback to change view
- `onUploadClick`: Callback to open upload modal

---

### 2. HomeFeed.jsx
**Location:** `src/components/HomeFeed.jsx`

**Features:**
- Displays feed of all posts
- Shows empty state when no posts
- Uses `FeedPostCard` for each post

**Props:**
- `posts`: Array of post objects
- `currentUserId`: ID of current user
- `loading`: Loading state

---

### 3. ExplorePage.jsx
**Location:** `src/components/ExplorePage.jsx`

**Features:**
- Search bar (UI only - client-side filtering)
- Filter buttons:
  - All posts
  - Verified (approved)
  - High Aura (posts with >10 aura points)
  - Recent posts
- Grid of posts from all users

**Props:**
- `currentUserId`: ID of current user

**TODO:**
- Implement server-side search
- Add more filter options
- Add pagination

---

### 4. ProfilePage.jsx
**Location:** `src/components/ProfilePage.jsx`

**Features:**
- User avatar and info
- Total aura points
- Bio display
- Grid of user's posts
- "Edit Profile" button (UI only - for own profile)

**Props:**
- `user`: Current user object
- `currentUserId`: ID of current user
- `profileId`: Optional - ID of profile to view (for viewing others)

**TODO:**
- Implement edit profile functionality
- Add ability to view other users' profiles from post cards

---

### 5. FeedPostCard.jsx
**Location:** `src/components/FeedPostCard.jsx`

**Features:**
- User avatar and name
- Post image
- Caption
- Verdict badge (processing/approved/rejected)
- Aura points display
- Action buttons (UI only):
  - Appreciate 🙏
  - Comment 💬
  - Share 🔗

**Props:**
- `post`: Post object with profile data
- `currentUserId`: ID of current user

**TODO:**
- Implement appreciate functionality
- Implement comment functionality
- Enhance share functionality

---

### 6. ContextPanel.jsx
**Location:** `src/components/ContextPanel.jsx`

**Features:**
- Motivational message
- Top 5 aura users
- Recent good deeds (last 5 approved posts)

**Props:**
- `currentUserId`: ID of current user

**Visibility:**
- Hidden on screens < 1200px width
- Sticky positioning on desktop

---

### 7. UploadModal.jsx
**Location:** `src/components/UploadModal.jsx`

**Features:**
- Modal overlay for uploading posts
- Reuses existing `UploadPost` component
- Closes automatically after successful upload

**Props:**
- `isOpen`: Boolean to control visibility
- `onClose`: Callback to close modal
- `user`: Current user object
- `functionUrl`: Image processing function URL
- `onPostCreated`: Callback after post creation

---

## View Routing

The dashboard uses simple state-based routing:

```javascript
const [currentView, setCurrentView] = useState('home')

// Views: 'home', 'explore', 'profile'
```

Views are switched via the Sidebar navigation buttons.

---

## Data Flow

1. **Dashboard.jsx** manages:
   - Current view state
   - Posts data (for home feed)
   - Profile data
   - Upload modal state

2. **Data Fetching:**
   - Posts fetched when view is 'home'
   - Profile fetched on mount and after post creation
   - Real-time updates via Supabase subscriptions

3. **Post Creation:**
   - Upload modal opens
   - User uploads via `UploadPost` component
   - On success: modal closes, posts refresh, profile refreshes

---

## Styling

All components have their own CSS files:
- `Sidebar.css`
- `HomeFeed.css`
- `ExplorePage.css`
- `ProfilePage.css`
- `FeedPostCard.css`
- `ContextPanel.css`
- `UploadModal.css`
- `Dashboard.css` (main layout)

Uses CSS variables from `src/index.css` for consistent theming.

---

## Responsive Design

- **Desktop (>1200px)**: 3-column layout (Sidebar | Main | Context)
- **Tablet (968px-1200px)**: 2-column layout (Sidebar | Main, Context hidden)
- **Mobile (<968px)**: Single column, sidebar becomes horizontal nav

---

## Future Enhancements

All TODO comments in code indicate where future features can be added:

1. **Appreciate Feature:**
   - Create `appreciations` table
   - Add backend logic to handle appreciations
   - Update `FeedPostCard` to show appreciation count

2. **Comment Feature:**
   - Create `comments` table
   - Add comment UI to `FeedPostCard`
   - Implement comment display and creation

3. **Search Enhancement:**
   - Move search to server-side
   - Add full-text search capabilities
   - Add search by tags/categories

4. **Profile Editing:**
   - Create edit profile modal/form
   - Add image upload for avatar
   - Update bio and display name

5. **View Other Profiles:**
   - Add click handler on user avatars/names
   - Navigate to ProfilePage with `profileId` prop
   - Add "View Profile" button on post cards

---

## Database Considerations

See `DATABASE_CHANGES.md` for optional database enhancements.

Current implementation works with existing schema. No database changes required.

