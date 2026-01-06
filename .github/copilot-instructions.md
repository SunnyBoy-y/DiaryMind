# GitHub Copilot / AI Agent instructions for DiaryMind

This file contains concise, actionable guidance to help AI coding agents be productive immediately in this repository.

## Quick summary
- DiaryMind = React + Vite frontend (`/ui`) + FastAPI backend (`/server`).
- Backend core code lives under `server/ALT_pure/` with modular subpackages: `core/api/`, `core/llm/`, `core/tts/`, `core/asr/`, `core/common/`.
- Primary dev server entrypoints:
  - Backend: `python server/main.py` (runs uvicorn loading `ALT_pure.core.api.api_utli:app`, default host 127.0.0.1 port 8082, reload enabled)
  - Frontend: `cd ui && npm run dev` (Vite)

## Where to look first (high value files)
- `server/main.py` — how backend is launched (uvicorn string import, reload, default port 8082).
- `server/ALT_pure/core/api/api_utli.py` — central router registration (includes `llm_api`, `tts_api`, `asr_api`, `diary_api`, etc.) and small HTML root page with usage examples.
- `server/openapi.json` and `/docs` (when server runs) — canonical request/response schemas (useful for payload examples).
- `ui/src/components/*` — examples of how the frontend calls APIs (watch for `API_BASE` usage and `VITE_API_*` env vars).
- `test_api.py` — a pragmatic health/load-testing script showing typical endpoints and payloads.

## Important patterns & conventions (project-specific)
- API modules live in `server/ALT_pure/core/api/`. Create a new file with an `APIRouter`, export `router`, then `import` & `app.include_router(...)` in `api_utli.py`.
- File naming quirk: the central file is named `api_utli.py` (typo-like). **Do not rename** unless you update all references (`main.py`, README) first.
- Use FastAPI models (Pydantic) for request/response shapes — schemas are already present in `openapi.json` (examples: `ChatRequest`, `DiaryContent`, `TextToAudioRequest`).
- Frontend uses Vite env vars to configure API base: `VITE_API_BASE`, `VITE_API_DIARY_BASE` (see `ui/src/components/*` for usage patterns).

## API examples (copyable)
- LLM chat (sync):
  - Endpoint: POST `/api/llm/chat`
  - Payload: `{"message": "你好", "role": "你是助手", "stream": false}`
  - Use `/api/llm/stream-chat` with `"stream": true` for SSE/stream behavior.
- ASR upload-and-transcribe (multipart):
  - Endpoint: POST `/api/asr/upload-and-transcribe?model_size=medium&device=auto`
  - Multipart field: `file` (binary audio)
- TTS text-to-audio:
  - Endpoint: POST `/api/tts/text-to-audio` with `{"text": "...", "filename": "output.wav"}`
- Diary save:
  - Endpoint: POST `/api/diary/save` with `{"filename": "Diary_2026-01-06.md", "content": "...", "format": "md"}`

Refer to `server/openapi.json` or the running `/docs` for exact schema details.

## Developer workflows & commands
- Backend local dev:
  - Create venv: `python -m venv venv` then `venv\Scripts\activate` (Windows)
  - Install: `pip install -r server/requirements.txt`
  - Set env: create `server/.env` containing at least `DASHSCOPE_API_KEY=...` and optional `MODEL_DIR`.
  - Run: `python server/main.py` (or run uvicorn directly for different host/port)
- Frontend local dev:
  - `cd ui && npm install && npm run dev`
  - To override API base: set `VITE_API_BASE` before starting Vite.
- Tests & checks:
  - `python -m pytest tests/ -v` (backend tests as documented; `test_api.py` is a manual API tester for quick checks)
  - Use `/docs` and `server/openapi.json` as canonical contract checks.
- Logs: check `server/log/` for runtime logs.

## Integration & external dependencies
- DashScope TTS: requires `DASHSCOPE_API_KEY` in `server/.env`. TTS endpoints rely on this service.
- ASR models: may download large models on first run; control model storage with `MODEL_DIR`.
- Music files: `server/music/` — used by music API; put audio files here for streaming endpoints.

## Debugging hints
- If endpoints fail, visit `http://127.0.0.1:8082/docs` for interactive API testing.
- Port mismatch: `main.py` and `server/README.md` list 8082 — ensure `test_api.py` BASE_URL matches running server.
- CUDA errors: make sure `device` query param is `cpu` when no GPU is present.

## Small tasks AI agents can do safely (examples)
- Add a new FastAPI route: create module under `server/ALT_pure/core/api/`, add router, register in `api_utli.py`, add tests and update `openapi.json` by running the app and exporting docs if needed.
- Add unit tests for existing endpoints using the patterns in `test_api.py` and FastAPI `TestClient`.
- Update `ui/src/components/` to use existing `API_BASE` env configuration and avoid hardcoded `/api/...` strings.

## Known oddities / gotchas
- `api_utli.py` name is inconsistent with common conventions (`api_utils` is suggested in `OPTIMIZATION.md`) — follow current filenames to avoid breaking imports.
- Some docs assume port `8082` while `main.py` prints port 8082 but comments mention 8000; use `8082` as canonical.
- There may not be a centralized unit test suite yet; `test_api.py` contains useful integration-style checks.

---
If any of the above is unclear or you want more concrete examples (e.g., a complete `APIRouter` template, test template, or frontend fetch helper), tell me which part and I will iterate. Thank you.