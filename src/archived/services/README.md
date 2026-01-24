# Archived Services

This directory contains services that have been identified as unused or replaced during the codebase audit of 2026-01-20.

## Purpose

These files are preserved for reference but are NOT part of the active codebase:
- They are excluded from the build
- They may contain useful code patterns or logic
- They can be restored if needed in the future

## Archived Files

| File | Date | Reason | Original LOC |
|------|------|--------|--------------|
| VB6COMActiveXBridge.ts | 2026-01-20 | Never instantiated, test-only reference | 1,170 |
| VB6Debugger.ts | 2026-01-20 | Replaced by VB6DebuggerService.ts | 338 |

## Restoration

To restore a service:
1. Move the file back to `src/services/`
2. Update any necessary imports
3. Run `npm run type-check` to verify compatibility
4. Update this README

## Related Tasks

- TASK-P1-002: Archive unused services batch 1
- TASK-P1-003: Archive unused services batch 2
