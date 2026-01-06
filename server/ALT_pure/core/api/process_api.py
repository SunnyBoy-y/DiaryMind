from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
import threading
import time
import re
import os
import concurrent.futures
from ...core.llm.qwen import LLM
from ...core.tts.huoshan import TTS
from ...log.load_log import logger

TAG = __name__
router = APIRouter()

# Store session data: {session_id: {"queue": [], "done": False, "cursor": 0}}
sessions: Dict[str, Dict] = {}

class FastProcessRequest(BaseModel):
    text: str

class PollResponse(BaseModel):
    events: List[Dict]
    done: bool

def process_thread(text: str, session_id: str):
    """
    Background thread to handle the full flow: LLM -> Split -> TTS -> Queue
    """
    logger.bind(tag=TAG).info(f"Session {session_id}: Starting processing")
    
    try:
        llm = LLM()
        tts = TTS()

        buffer = ""
        split_pattern = r'([\.?!。？！\n]+)'

        role = "你是助手"

        first_audio_done = False
        fast_start_min_chars = 8
        fast_start_max_chars = 20
        processing_finished = False
        pending_count = 0
        executor: Optional[concurrent.futures.ThreadPoolExecutor] = None

        def submit_async(sentence: str):
            nonlocal pending_count, executor
            if executor is None:
                executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)
            pending_count += 1

            filename = f"{uuid.uuid4().hex}.wav"

            def job_run(s: str, f: str):
                try:
                    ok = tts.text_to_audio(s, f)
                    return {
                        "ok": ok,
                        "filename": f,
                        "text": s,
                    }
                except Exception as e:
                    return {"ok": False, "error": str(e), "text": s}

            future = executor.submit(job_run, sentence, filename)

            def on_done(fut: concurrent.futures.Future):
                nonlocal pending_count
                try:
                    result = fut.result()
                    if result.get("ok"):
                        sessions[session_id]["queue"].append({
                            "type": "audio",
                            "url": f"/api/tts/audio/{result['filename']}",
                            "text": result["text"],
                            "timestamp": time.time()
                        })
                    else:
                        sessions[session_id]["queue"].append({
                            "type": "error",
                            "content": result.get("error", "TTS failed"),
                            "timestamp": time.time()
                        })
                finally:
                    pending_count -= 1
                    if processing_finished and pending_count == 0:
                        sessions[session_id]["done"] = True
                        logger.bind(tag=TAG).info(f"Session {session_id}: All audio tasks completed")

            future.add_done_callback(on_done)

        for chunk in llm.request(role, text):
            sessions[session_id]["queue"].append({
                "type": "text",
                "content": chunk,
                "timestamp": time.time()
            })

            buffer += chunk

            if not first_audio_done:
                stripped_len = len(buffer.strip())
                if stripped_len >= fast_start_min_chars:
                    window = buffer[:fast_start_max_chars]
                    pm = re.search(r'([\.?!。？！,，;；:：、\n])', window)
                    cut_idx = pm.end() if pm else min(len(buffer), fast_start_max_chars)
                    sentence = buffer[:cut_idx]
                    buffer = buffer[cut_idx:]
                    if sentence.strip():
                        _generate_audio(tts, sentence, session_id)
                        first_audio_done = True

            while True:
                match = re.search(split_pattern, buffer)
                if match:
                    end_idx = match.end()
                    sentence = buffer[:end_idx]
                    buffer = buffer[end_idx:]
                    if sentence.strip():
                        if not first_audio_done:
                            _generate_audio(tts, sentence, session_id)
                            first_audio_done = True
                        else:
                            submit_async(sentence)
                else:
                    if len(buffer) > 50:
                        comma_match = re.search(r'([,，])', buffer)
                        if comma_match:
                            end_idx = comma_match.end()
                            sentence = buffer[:end_idx]
                            buffer = buffer[end_idx:]
                            if sentence.strip():
                                if not first_audio_done:
                                    _generate_audio(tts, sentence, session_id)
                                    first_audio_done = True
                                else:
                                    submit_async(sentence)
                        else:
                            pass
                    break

        if buffer.strip():
            if not first_audio_done:
                _generate_audio(tts, buffer, session_id)
                first_audio_done = True
            else:
                submit_async(buffer)

        processing_finished = True
        if pending_count == 0:
            sessions[session_id]["done"] = True
            logger.bind(tag=TAG).info(f"Session {session_id}: Processing finished (no pending tasks)")

    except Exception as e:
        logger.bind(tag=TAG).error(f"Session {session_id}: Error in processing - {str(e)}")
        sessions[session_id]["queue"].append({
            "type": "error",
            "content": str(e),
            "timestamp": time.time()
        })
        sessions[session_id]["done"] = True
    

def _generate_audio(tts: TTS, text: str, session_id: str):
    """
    Helper to generate audio and put in queue
    """
    try:
        # Generate unique filename
        filename = f"{uuid.uuid4().hex}.wav"
        
        # Call TTS
        # Note: text_to_audio calls asyncio.run(), so it blocks this thread until done.
        # This ensures we don't spawn too many concurrent TTS requests which might hit API limits.
        # But it might slow down the pipeline.
        # "Optimization": If we want to be faster, we could run this in parallel?
        # But huoshan.py limits workers? It has TaskManager.
        # However, text_to_audio seems to handle one request.
        # For extreme optimization, we might want to fire this asynchronously.
        # But let's keep it simple first. The user said "send ... immediately".
        # If we block here, the next sentence waits.
        # Latency < 2s is the goal.
        
        success = tts.text_to_audio(text, filename)
        
        if success:
            sessions[session_id]["queue"].append({
                "type": "audio",
                "url": f"/api/tts/audio/{filename}",
                "text": text,
                "timestamp": time.time()
            })
        else:
            logger.bind(tag=TAG).error(f"Session {session_id}: TTS failed for text: {text}")
            
    except Exception as e:
        logger.bind(tag=TAG).error(f"Session {session_id}: Error generating audio - {str(e)}")

@router.post("/fast_process_all")
async def fast_process_all(request: FastProcessRequest):
    """
    Start the fast process pipeline.
    Returns a session_id.
    """
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "queue": [],
        "done": False,
        "created_at": time.time()
    }
    
    # Start background thread
    t = threading.Thread(target=process_thread, args=(request.text, session_id))
    t.daemon = True
    t.start()
    
    return {"session_id": session_id, "message": "Processing started"}

@router.get("/poll")
async def poll(session_id: str, last_index: int = 0):
    """
    Poll for new events.
    frontend should track the index of events it has processed.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    events = session["queue"]
    
    # Return events starting from last_index
    new_events = events[last_index:]
    
    return {
        "events": new_events,
        "done": session["done"],
        "total_events": len(events)
    }

@router.get("/ui_test", response_class=HTMLResponse)
async def ui_test():
    return """
<!DOCTYPE html>
<html>
<head>
    <title>Fast Process UI Test</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        #log { margin-top: 20px; padding: 10px; border: 1px solid #ccc; height: 300px; overflow-y: scroll; white-space: pre-wrap; background: #f9f9f9; }
        .audio-item { margin: 5px 0; padding: 5px; background: #eee; border-radius: 4px; }
        .playing { background: #cfc; border: 1px solid #ada; }
        .controls { margin-bottom: 20px; }
        button { padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        #metrics { margin-top: 10px; padding: 10px; border: 1px solid #ccc; background: #fff; }
    </style>
</head>
<body>
    <h1>Fast Process Test</h1>
    <div class="controls">
        <textarea id="input" rows="4" placeholder="Enter text here..."></textarea><br><br>
        <button onclick="startProcess()">Start Processing</button>
    </div>
    <div id="status">Ready</div>
    <div id="log"></div>
    <div id="metrics"></div>
    <div id="audio-container"></div>

    <script>
        let sessionId = null;
        let eventIndex = 0;
        let audioQueue = [];
        let isPlaying = false;
        let pollInterval = null;
        let clickStart = null;
        let audioIndexCounter = 0;

        async function startProcess() {
            const text = document.getElementById('input').value;
            if (!text) {
                alert("Please enter some text");
                return;
            }
            
            document.getElementById('log').textContent = '';
            document.getElementById('audio-container').innerHTML = '';
            document.getElementById('status').textContent = 'Starting...';
            document.getElementById('metrics').innerHTML = '';
            audioQueue = [];
            eventIndex = 0;
            isPlaying = false;
            clickStart = performance.now();
            audioIndexCounter = 0;
            
            if (pollInterval) clearInterval(pollInterval);
            
            try {
                const res = await fetch('/api/process/fast_process_all', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({text: text})
                });
                
                if (!res.ok) {
                    throw new Error(`Server error: ${res.status}`);
                }
                
                const data = await res.json();
                sessionId = data.session_id;
                document.getElementById('status').textContent = 'Processing... Session: ' + sessionId;
                
                pollInterval = setInterval(poll, 200); // Poll every 200ms for lower latency
                
            } catch (e) {
                console.error(e);
                document.getElementById('status').textContent = 'Error: ' + e.message;
            }
        }

        async function poll() {
            if (!sessionId) return;
            try {
                const res = await fetch(`/api/process/poll?session_id=${sessionId}&last_index=${eventIndex}`);
                if (!res.ok) return;
                
                const data = await res.json();
                
                if (data.events && data.events.length > 0) {
                    eventIndex += data.events.length; // Update index
                    
                    for (const event of data.events) {
                        if (event.type === 'text') {
                            const log = document.getElementById('log');
                            // Append text properly
                            log.textContent += event.content;
                            log.scrollTop = log.scrollHeight;
                        } else if (event.type === 'audio') {
                            console.log("Received audio:", event.url);
                            queueAudio(event.url, event.text);
                        } else if (event.type === 'error') {
                            document.getElementById('status').textContent = 'Error: ' + event.content;
                        }
                    }
                }
                
                // Only stop polling when backend is done AND we've consumed all events AND playback queue is empty
                if (data.done && eventIndex >= data.total_events && audioQueue.length === 0 && !isPlaying) {
                    document.getElementById('status').textContent = 'All Done.';
                    clearInterval(pollInterval);
                    pollInterval = null;
                } else if (data.done) {
                    document.getElementById('status').textContent = 'Generation Finished. Playing audio...';
                }
            } catch (e) {
                console.error("Poll error", e);
            }
        }

        function queueAudio(url, text) {
            audioIndexCounter += 1;
            audioQueue.push({url, text, index: audioIndexCounter});
            processAudioQueue();
        }

        function processAudioQueue() {
            if (isPlaying || audioQueue.length === 0) return;
            
            isPlaying = true;
            const item = audioQueue.shift();
            
            const div = document.createElement('div');
            div.className = 'audio-item playing';
            div.textContent = 'Playing segment: ' + (item.text.length > 20 ? item.text.substring(0, 20) + '...' : item.text);
            document.getElementById('audio-container').appendChild(div);
            div.scrollIntoView({behavior: "smooth"});
            
            const audio = new Audio(item.url);
            audio.onplay = () => {
                const dt = (performance.now() - clickStart) / 1000;
                const m = document.getElementById('metrics');
                const line = document.createElement('div');
                line.textContent = `音频片段 #${item.index} 开始播放: ${dt.toFixed(2)}s`;
                m.appendChild(line);
            };
            audio.onended = () => {
                div.className = 'audio-item'; // Remove playing style
                isPlaying = false;
                processAudioQueue();
            };
            audio.onerror = (e) => {
                console.error("Audio playback error", e);
                div.textContent += " (Error)";
                div.style.color = "red";
                isPlaying = false;
                processAudioQueue();
            }
            
            audio.play().catch(e => {
                console.error("Play failed", e);
                div.textContent += " (Auto-play blocked?)";
                isPlaying = false;
                processAudioQueue();
            });
        }
    </script>
</body>
</html>
    """
