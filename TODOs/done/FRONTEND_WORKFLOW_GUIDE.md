# Frontend API Workflow Guide

Welcome to the UniQAKNTU Frontend Integration Guide! While the Swagger UI (`/api/docs/`) provides the exact endpoints, request bodies, and field types, this document explains the **lifecycle** of those resources and how they tie together to build the application flows.

Read this document *before* diving into Swagger to understand the big picture.

---

## 1. The Core Flow: From Source to Question to Answer

The platform revolves around academic questions. The standard lifecycle is as follows:

### Step 1: Source Materials (Admins/Moderators Only)
Before a question can be asked, it must be tied to a `SourceMaterial` (e.g., "Fall 2023 Midterm"). 
- **Endpoint:** `POST /api/source-materials/`
- **Who:** Only Admins and Moderators can create these. Students can only list them (`GET /api/source-materials/`).
- **Action:** The frontend should fetch the list of source materials to populate a dropdown when a student is asking a new question.

### Step 2: Asking a Question (Students)
A student selects a source material and asks a question.
- **Endpoint:** `POST /api/questions/`
- **Initial Status:** The question is created with a status of **`PENDING`**.
- **Visibility:** While pending, only the author (and admins/moderators) can see it in the `GET /api/questions/` list. Other students will not see it.

### Step 3: Admin Approval (Admins/Moderators Only)
To prevent spam, questions must be reviewed.
- **Endpoint:** `POST /api/questions/{id}/approve/` (or `/reject/`)
- **Action:** An admin approves the question. Its status becomes **`APPROVED`** and it is now visible to everyone.

### Step 4: Answering a Question (Students)
Once a question is approved, users can submit answers.
- **Endpoint:** `POST /api/answers/` (You must pass the `question` ID in the body).
- **Initial Status:** Just like questions, new answers start as **`PENDING`** and are only visible to the author and admins.

### Step 5: Answer Approval (Admins/Moderators Only)
- **Endpoint:** `POST /api/answers/{id}/approve/`
- **Action:** Admin approves the answer. It becomes visible to everyone.

### Step 6: Accepting the Best Answer (Question Author Only)
The student who originally asked the question can mark one approved answer as the "Accepted" answer.
- **Endpoint:** `POST /api/answers/{id}/accept/`
- **Action:** Marks `is_accepted = True` on the answer. This un-accepts any previously accepted answer for that question.

---

## 2. Attachments & Inline Markdown (Orphan Claiming)

We use a highly flexible "Inline Markdown" approach for images and files.

1. **Upload First (Orphans):** When a user drops an image into the text editor, immediately upload it via `POST /api/attachments/`. You only need to send the binary `file`. The API will return an `id` and a `file` (URL). 
2. **Embed:** Inject the returned URL into the markdown text (e.g., `![image](url)`).
3. **Claim:** When the user finally hits "Submit" to create the Question or Answer, pass the list of all attachment IDs they used in an array called `attachment_ids: [1, 2, 3]`.
4. **Declarative Syncing:** When **editing** a post (`PATCH /api/questions/{id}/`), simply pass the final array of IDs you want to keep (`attachment_ids: [1, 3]`). The backend will automatically delete any attachments (like `2`) that were removed!

---

## 3. Community Edits (Wiki-style Collaboration)

We don't allow students to directly edit posts after they are created (unless they are admins). Instead, we use a Wiki-style suggestion system.

1. **Suggest an Edit:** Any user can suggest a better version of a Question or Answer.
   - **Endpoint:** `POST /api/questions/{id}/suggest_edit/` (or `/api/answers/{id}/suggest_edit/`)
   - **Body:** Send `proposed_text` and `attachment_ids` (if they added any new images).
2. **Admin Review:** Admins view the list of suggestions at `GET /api/suggested_edits/`.
3. **Approval:** If the admin hits `POST /api/suggested_edits/{id}/approve/`, the original Question/Answer text is overwritten, new attachments are transferred, and old attachments that were removed from the text are permanently deleted.

---

## 4. Tags & Categories

Tags help organize questions.
1. **Categories:** Admins create `TagCategory` (e.g., "Difficulty", "Topic").
2. **Tags:** Admins create `Tag` under those categories (e.g., "Hard", "Calculus").
3. **Usage:** When creating or updating a Question, the frontend passes `tag_ids: [4, 5]`.
4. **Filtering:** You can filter the tag list using `GET /api/tags/?category=1` or search using `?search=calculus`.

---

## 5. Interactions (Votes & Comments)

- **Voting:** Users can upvote (`1`) or downvote (`-1`) Questions and Answers via `POST /api/questions/{id}/vote/`. Calling it again with the same value removes the vote. The backend returns a `score` and a `user_vote` (which tells you what the current logged-in user voted).
- **Commenting:** Users can attach lightweight text comments to Questions and Answers. 
   - **Endpoints:** `/api/questions/{id}/comments/` (GET/POST)

---

## 6. User Management & Roles

- **Roles:** Users are either `STUDENT`, `MODERATOR`, or `ADMIN`.
- **User List:** Admins and Moderators can view all users at `GET /api/users/`. (Supports `?role=STUDENT` and `?search=email`).
- **Changing Roles:** ONLY Admins can promote/demote users using `PATCH /api/users/{id}/role/` by passing `{"role": "MODERATOR"}`.

---

## Summary Checklist for Frontend Forms
- [ ] Before showing the "New Question" form, fetch `GET /api/source-materials/` and `GET /api/tags/`.
- [ ] During typing, if an image is dropped, upload to `POST /api/attachments/` and insert the link.
- [ ] On submit, gather the final Markdown text, the `source_material` ID, the `tag_ids`, and the `attachment_ids`, and `POST` to `/api/questions/`.
- [ ] Remember that the user won't see their post in the public feed until an admin approves it, so show them a "Pending Review" badge on their profile/dashboard!
