# UniQAKNTU Authentication API Documentation

This document provides everything you need to implement the frontend authentication flows, including registration, login, JWT token management, email verification, password reset, and profile management.

> [!IMPORTANT]
> **Base URL:** All authentication endpoints are prefixed with `/api/auth/`.
> **Authorization:** Endpoints marked with 🔒 require the `Authorization: Bearer <access_token>` header.

---

## 1. Onboarding & Login

### Register a New Account
**`POST /api/auth/register/`**
Creates a new user. The account starts as `is_email_verified = False` and cannot log in until the email is verified.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@kntu.ac.ir",
  "password": "SecurePassword123!",
  "password2": "SecurePassword123!"
}
```

**Success Response (201 Created):**
```json
{
  "detail": "Registration successful. A verification code has been sent to your email."
}
```

> [!NOTE]
> **Important:** Immediately after a successful registration, an OTP for verifying the email is sent **automatically**. You do not need to call the `send-otp` API right away. Only send a request to `send-otp` if the user clicks a "Resend Code" button because they didn't receive the initial email.


### Login
**`POST /api/auth/login/`**
Authenticates the user and returns JWT access and refresh tokens.

> [!WARNING]
> **Brute Force Protection:** 5 consecutive failed login attempts will lock the IP/Username pair for 15 minutes, returning a `429 Too Many Requests`.

**Request Body:**
```json
{
  "identifier": "john_doe", // Can be either username or email
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "refresh": "eyJ0eXAi...",
  "access": "eyJ0eXAi..."
}
```

---

## 2. Token Management

### Refresh Token
**`POST /api/auth/token/refresh/`**
Exchanges a valid refresh token for a brand new pair of tokens. 

> [!TIP]
> We use **Refresh Token Rotation**. When you refresh a token, the old refresh token is blacklisted and a new one is issued. Always replace the stored refresh token with the newly returned one.

**Request Body:**
```json
{
  "refresh": "<your_current_refresh_token>"
}
```

**Success Response (200 OK):**
```json
{
  "access": "eyJ0eXAi...<new>",
  "refresh": "eyJ0eXAi...<new>"
}
```


### Logout 🔒
**`POST /api/auth/logout/`**
Blacklists the refresh token on the server so it can no longer be used.

**Request Body:**
```json
{
  "refresh": "<your_current_refresh_token>"
}
```
**Success Response:** `200 OK`

---

## 3. OTP & Email Verification

### Send OTP
**`POST /api/auth/send-otp/`**
Dispatches a 6-digit OTP to the user's email. 

> [!WARNING]
> Rate limited to **3 requests per hour** per user/email combination to prevent spam.

**Request Body:**
```json
{
  "email": "john@kntu.ac.ir",
  "otp_type": "verify_email" // or "password_reset"
}
```
**Success Response:** `200 OK` (Empty response)


### Verify Email
**`POST /api/auth/verify-email/`**
Consumes the OTP to mark the account as verified. Once verified, the user can successfully log in.

> [!CAUTION]
> Submitting the wrong OTP 5 times will permanently invalidate the OTP and lock it out (`429 Too Many Requests`). The user must request a new OTP.

**Request Body:**
```json
{
  "email": "john@kntu.ac.ir",
  "otp": "123456"
}
```
**Success Response:** `200 OK`

---

## 4. Password Management

### Reset Password (Forgot Password)
**`POST /api/auth/reset-password/`**
Allows an unauthenticated user to reset their password using an OTP sent to their email (via `otp_type: password_reset`).

**Request Body:**
```json
{
  "email": "john@kntu.ac.ir",
  "otp": "123456",
  "new_password": "NewSecurePassword123!",
  "new_password2": "NewSecurePassword123!"
}
```
**Success Response:** `200 OK`


### Change Password 🔒
**`POST /api/auth/change-password/`**
Allows an authenticated user to change their password by providing their current password. 

> [!WARNING]
> Providing the wrong `current_password` 5 times triggers a 15-minute `429` lockout to prevent credential stuffing.

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewSecurePassword123!",
  "new_password2": "NewSecurePassword123!"
}
```
**Success Response:** `200 OK`

---

## 5. Profile & Account Settings

### Get Current Profile 🔒
**`GET /api/auth/me/`**
Returns the profile of the currently logged-in user.

**Success Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@kntu.ac.ir",
  "first_name": "John",
  "last_name": "Doe",
  "role": "STUDENT",
  "is_email_verified": true,
  "date_joined": "2026-08-30T10:00:00Z"
}
```


### Update Profile 🔒
**`PATCH /api/auth/me/`**
Update the user's profile details. You can send any subset of the allowed fields.

> [!NOTE]
> When changing `username`, it performs a case-insensitive check against the database to ensure it's unique.

**Request Body (Partial):**
```json
{
  "username": "new_john_doe",
  "first_name": "Johnny"
}
```
**Success Response (200 OK):** Returns the fully updated profile object.


### Request Email Change 🔒
**`POST /api/auth/change-email/request/`**
Initiates an email change. Requires the user's current password for security. Sends an OTP to the **new** email address and a security alert to the **old** email address.

> [!WARNING]
> Like changing a password, 5 incorrect `current_password` attempts triggers a 15-minute `429` lockout.

**Request Body:**
```json
{
  "current_password": "MyPassword123!",
  "new_email": "new_john@kntu.ac.ir"
}
```
**Success Response:** `200 OK`


### Verify Email Change 🔒
**`POST /api/auth/change-email/verify/`**
Finalizes the email change by providing the OTP sent to the new email address.

**Request Body:**
```json
{
  "otp": "654321"
}
```
**Success Response (200 OK):** Returns the fully updated profile object with the new email.
