# Security Specification for SOMENH.AI

## 1. Data Invariants
- A user can only access their own profile, history, and interpretations.
- `interpretedChartIds` in User profile can only be appended by the system logic (validated via rules checking `request.auth.uid`).
- History entries must correspond to the user's UID.
- Document IDs for history and interpretations must be valid strings and not exceed size limits.
- Timestamps must be server-generated (`request.time`).

## 2. The "Dirty Dozen" Payloads (Attack Scenarios)

### Identity Spoofing
1. **User A tries to read User B's profile.**
   - Path: `/users/userB`
   - Expected: `PERMISSION_DENIED`
2. **User A tries to list certificates in User B's history.**
   - Path: `/users/userB/history`
   - Expected: `PERMISSION_DENIED`
3. **User A tries to write to User B's history.**
   - Path: `/users/userB/history/chart1`
   - Payload: `{ name: "Hacker" }`
   - Expected: `PERMISSION_DENIED`

### Integrity Violation
4. **Spoofing `uid` in profile creation.**
   - Path: `/users/userA` (Auth User A)
   - Payload: `{ uid: "userB", email: "userA@email.com" }`
   - Expected: `PERMISSION_DENIED`
5. **Updating `interpretedChartIds` to someone else's array.**
   - Path: `/users/userA`
   - Payload: `{ interpretedChartIds: ["evil_chart_id"] }` (bypass system logic)
   - Expected: Validated by owner check, but needs exact key check on creation.

### Resource Exhaustion / Poisoning
6. **Injecting 1MB string into a palace name.**
   - Path: `/users/userA/history/chart1/interpretations/VERY_LONG_STRING_...`
   - Expected: `PERMISSION_DENIED` (via `isValidId`)
7. **Injecting huge payload into user profile.**
   - Path: `/users/userA`
   - Payload: `{ displayName: "A".repeat(1000000) }`
   - Expected: `PERMISSION_DENIED` (via size checks)

### Relational Sync / Phantom Writes
8. **Creating an interpretation for a non-existent history record.**
   - Path: `/users/userA/history/ghost/interpretations/Menh`
   - Expected: `PERMISSION_DENIED` (via `exists` check on parent history doc)

### State Shortcutting
9. **Directly writing to `interpretedChartIds` without generating AI response.**
   - (Logic: Client could try to increment their own quota manually)
   - Expected: Rules should ensure only owner writes, but harder to block "skip AI" if same user is allowed to write.

### PII Leakage
10. **Listing all users (Blanket Read).**
    - Path: `/users`
    - Expected: `PERMISSION_DENIED`

### Unauthenticated Access
11. **Anonymous read of history.**
    - Request: `auth = null`
    - Path: `/users/userA/history`
    - Expected: `PERMISSION_DENIED`

### Verified Email Check (if applicable)
12. **Writing from unverified email.**
    - Request: `auth.token.email_verified = false`
    - Path: `/users/userA/history`
    - Expected: `PERMISSION_DENIED`

## 3. Test Runner (Conceptual)
All above payloads must be caught by `firestore.rules`.
