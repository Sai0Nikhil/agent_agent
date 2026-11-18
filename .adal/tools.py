"""
AdaL Custom Python Tools (.adal/tools.py)
Exposes BAND, Lyzr, Finch, and Agent37 orchestration primitives directly
inside the AdaL CLI agent harness for the Diwali Festiverse A2A Hackathon.
"""

import json
import os
import urllib.request
from typing import Any, Dict


def _post_json(url: str, payload: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def query_lyzr_data_agent(topic: str) -> Dict[str, Any]:
    """Invoke the Lyzr Agent Studio Data Agent to structure live research on a topic."""
    api_key = os.getenv("LYZR_API_KEY")
    agent_id = os.getenv("LYZR_DATA_AGENT_ID")
    user_id = os.getenv("LYZR_USER_ID", "hackathon@diyapulse.ai")
    if not api_key or not agent_id:
        return {"mode": "fallback", "message": "Set LYZR_API_KEY and LYZR_DATA_AGENT_ID to run live Lyzr inference."}
    return _post_json(
        "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
        {
            "user_id": user_id,
            "agent_id": agent_id,
            "session_id": f"adal-{topic[:24].replace(' ', '-').lower()}",
            "message": f"Synthesize live industry research for: {topic}. Return structured KPIs, entities, and insights.",
        },
        {"x-api-key": api_key},
    )


def post_band_handoff(chat_id: str, content: str, mention_handle: str) -> Dict[str, Any]:
    """Post an A2A handoff message with @mention into a shared BAND room."""
    api_key = os.getenv("BAND_BUILDER_AGENT_API_KEY") or os.getenv("BAND_DATA_AGENT_API_KEY")
    base = os.getenv("BAND_API_BASE", "https://api.band.ai")
    if not api_key:
        return {"mode": "fallback", "message": "Set BAND_BUILDER_AGENT_API_KEY to post live BAND messages."}
    return _post_json(
        f"{base}/api/v1/agent/chats/{chat_id}/messages",
        {
            "message": {
                "content": f"@{mention_handle} {content}",
                "mentions": [{"handle": mention_handle}],
            }
        },
        {"X-API-Key": api_key},
    )


def publish_to_agent37(html_content: str, instance_id: str = "") -> Dict[str, Any]:
    """Deploy a generated HTML dashboard to an Agent37 sandbox and expose a public HTTPS URL."""
    api_key = os.getenv("AGENT37_API_KEY")
    if not api_key:
        return {"mode": "fallback", "message": "Set AGENT37_API_KEY to deploy live to Agent37."}

    target_id = instance_id or os.getenv("AGENT37_INSTANCE_ID", "")
    if not target_id:
        inst = _post_json(
            "https://api.agent37.com/v1/instances",
            {"template": "agent37-hermes", "name": "diyapulse-builder"},
            {"Authorization": f"Bearer {api_key}"},
        )
        target_id = inst.get("id", "")

    import base64

    b64 = base64.b64encode(html_content.encode("utf-8")).decode("ascii")
    _post_json(
        f"https://sandbox.agent37.app/v1/instances/{target_id}/exec",
        {
            "command": (
                f"mkdir -p ~/site && echo '{b64}' | base64 -d > ~/site/index.html && "
                "pkill -f 'http.server 8788' || true; "
                "nohup python3 -m http.server 8788 --directory ~/site >/tmp/site.log 2>&1 &"
            )
        },
        {"X-Agent37-Key": api_key},
    )

    port_resp = _post_json(
        f"https://api.agent37.com/v1/instances/{target_id}/public-ports",
        {"port": 8788, "label": "DiyaPulse Research Dashboard"},
        {"Authorization": f"Bearer {api_key}"},
    )
    return {"instance_id": target_id, "public_url": port_resp.get("url")}
