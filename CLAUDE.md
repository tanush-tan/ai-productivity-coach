# AI Productivity Coach: Agent Instructions

## Project
Existing application built with React, Vite, JavaScript/JSX, CSS, Node.js, Express and PostgreSQL.

Read PROJECT_STATUS.md when project status is relevant. Treat the actual code as the source of truth for implementation details.

## Workflow
- Make only the changes explicitly requested by the user.
- Before each implementation prompt, briefly explain what will change and the expected result.
- Keep implementation prompts concise and token-efficient.
- Do not rebuild existing features or perform full-project audits unless explicitly requested.
- Do not launch browsers, take screenshots, or use browser automation unless explicitly requested.
- Do not manually test UI forms through browser automation.
- Avoid unrelated refactoring, new dependencies, and unnecessary file changes.
- Preserve existing parent and student frontend functionality.
- Use JavaScript/JSX, not TypeScript, unless requested.
- Do not commit or push without permission.
- Do not claim a feature or test works unless verified.
- Explain any required environment setup clearly.
- Implement one milestone at a time and wait for approval before unrelated work.

## Current direction
The parent and student frontends exist and use some simulated data. The Express backend foundation and PostgreSQL connection code have been created. A local PostgreSQL server is not currently available, so the database connection has not yet been verified successfully.

Planned next step: establish a working PostgreSQL connection, then design the initial schema and implement real authentication incrementally.

Do not implement future milestones unless requested.