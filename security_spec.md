# Security Specification & Hardening Matrix

## 1. Data Invariants
1. **Identity Confinement**: A user can only read, create, update, or delete data within their own subcollections `/users/{userId}/...` where `request.auth.uid == userId`.
2. **Identity Integrity**: For every document created, `incoming().userId` must strictly equal `request.auth.uid`.
3. **Immutability of Identity**: On update, `incoming().userId == existing().userId`.
4. **Temporal Integrity**: All timestamp fields (`createdAt`, `updatedAt`) must strictly match `request.time`.
5. **Bounded Inputs & Types**: Strings must enforce strict `.size()` upper limits (e.g., location names <= 100 chars, text <= 2000 chars).
6. **No Client Side Role / Privilege Elevation**: Admins are determined via server-side verification (`/admins/{uid}` or runtime bootstrap `sasankm2009@gmail.com`).
7. **Default Deny**: Global catch-all prevents access to any unspecified collections or system documents.

## 2. The "Dirty Dozen" Malicious Payloads
1. **Payload 1 (Identity Spoofing on Location)**: User A sends `userId: "user_B"` to create a saved location in User B's subcollection. Must return `PERMISSION_DENIED`.
2. **Payload 2 (Ghost Field Attack)**: User attempts to inject `{ isSuperAdmin: true }` into `savedLocations`. Rejected via strict `hasOnly()` keys.
3. **Payload 3 (Denial of Wallet / 1MB String)**: User attempts to write a 1MB payload string as `name`. Rejected via `name.size() <= 100`.
4. **Payload 4 (Client Timestamp Forgery)**: User supplies an arbitrary historical or future timestamp for `createdAt`. Rejected via `incoming().createdAt == request.time`.
5. **Payload 5 (Cross-Tenant Snooping)**: User A attempts to `list` or `get` User B's `savedLocations`. Rejected via `request.auth.uid == userId`.
6. **Payload 6 (Unauthenticated Write)**: Unauthenticated visitor attempts to create a document in `/users/{userId}/savedLocations`. Rejected via `isSignedIn()`.
7. **Payload 7 (Path Variable Poisoning)**: Malicious user injects special characters `../` or junk strings into `{locationId}`. Rejected via `isValidId(locationId)`.
8. **Payload 8 (Invalid Preference Unit Injection)**: User updates `temperatureUnit` to `'kelvin'` or arbitrary code. Rejected via enum check `['celsius', 'fahrenheit']`.
9. **Payload 9 (Chat History Hijacking)**: User A attempts to overwrite User B's chat history. Rejected via `request.auth.uid == userId`.
10. **Payload 10 (Chat Text Overflow Attack)**: Attacker submits a prompt > 2000 characters to exhaust database storage. Rejected via `text.size() <= 2000`.
11. **Payload 11 (Blanket Collection Scraping)**: Malicious client queries root `/users` collection directly. Rejected by default-deny catchall.
12. **Payload 12 (Unverified Email Write)**: Unverified email identity attempts to perform database mutation without verification. Rejected via `request.auth.token.email_verified == true`.
