# Firebase Security Specification - DPS Staff Portal

## 1. Data Invariants
- The application stores all its state in a single document: `portal/data`.
- Only authenticated users (even anonymous) can read and write the data.
- System-locked flag should be respected if present.
- Data must follow the `AppData` structure.

## 2. The "Dirty Dozen" Payloads (Denial Tests)
1. **Unauthenticated Read:** Attempt to read `portal/data` without signing in. (Expected: Denied)
2. **Unauthenticated Write:** Attempt to write any data to `portal/data` without signing in. (Expected: Denied)
3. **Malicious ID Write:** Attempt to create a document with a massive or invalid ID in the `portal` collection (e.g. `portal/vandalism_path_that_is_too_long...`). (Expected: Denied)
4. **Invalid Schema (String as Array):** Attempt to update `students` with a string instead of an array. (Expected: Denied)
5. **Invalid Schema (Massive String):** Attempt to write a 2MB string into a field. (Expected: Denied)
6. **Key Poisoning:** Attempt to add unauthorized keys like `isAdmin: true` to the data object if not defined in schema. (Expected: Denied)
7. **Type Mismatch (Boolean as Number):** Attempt to set `systemLocked` to a number. (Expected: Denied)
8. **Delete Main Data:** Attempt to delete the `portal/data` document. (Expected: Denied)
9. **Relational Ghosting:** Attempt to write a student with an ID that is invalid. (Expected: Denied)
10. **Timestamp Spoofing:** Attempt to write a manual `updatedAt` that is in the future. (Expected: Denied)
11. **PII Leakage:** Attempt to read sensitive fields if they were separated (not applicable here as it's monolithic, but we'll secure the gate).
12. **Collection Creation:** Attempt to create an unauthorized top-level collection. (Expected: Denied)

## 3. Test Runner (Mock)
A suite of tests would verify that `allow write: if isSignedIn()` and `isValidAppData(incoming())` are enforced.
