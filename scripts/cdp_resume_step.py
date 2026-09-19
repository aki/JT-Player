import json, socket, base64, os, struct, urllib.request, time
from pathlib import Path

STATE = Path.home() / "AppData/Roaming/jt-player/jt-player-state.json"


def connect():
    info = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list"))
    page = next(i for i in info if i.get("type") == "page")
    url = page["webSocketDebuggerUrl"]
    hostport, path = url[5:].split("/", 1)
    host, port = hostport.split(":")
    port = int(port)
    path = "/" + path
    key = base64.b64encode(os.urandom(16)).decode()
    s = socket.create_connection((host, port), timeout=20)
    s.sendall(
        (
            f"GET {path} HTTP/1.1\r\nHost: {host}:{port}\r\n"
            f"Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
        ).encode()
    )
    resp = b""
    while b"\r\n\r\n" not in resp:
        resp += s.recv(4096)
    return s, b""


def enc(p):
    m = os.urandom(4)
    x = bytes(b ^ m[i % 4] for i, b in enumerate(p))
    n = len(p)
    h = bytes([0x81])
    h += bytes([0x80 | n]) if n < 126 else bytes([0x80 | 126]) + struct.pack(">H", n)
    return h + m + x


def cdp(s, buf, mid, expr):
    s.sendall(
        enc(
            json.dumps(
                {
                    "id": mid,
                    "method": "Runtime.evaluate",
                    "params": {"expression": expr, "returnByValue": True, "awaitPromise": True},
                }
            ).encode()
        )
    )
    while True:
        if len(buf) < 2:
            buf += s.recv(65536)
            continue
        b2 = buf[1]
        n = b2 & 0x7F
        i = 2
        if n == 126:
            n = struct.unpack(">H", buf[i : i + 2])[0]
            i += 2
        elif n == 127:
            n = struct.unpack(">Q", buf[i : i + 8])[0]
            i += 8
        if b2 & 0x80:
            i += 4
        if len(buf) < i + n:
            buf += s.recv(65536)
            continue
        payload = buf[i : i + n]
        if b2 & 0x80:
            mask = buf[i - 4 : i]
            payload = bytes(payload[j] ^ mask[j % 4] for j in range(n))
        data = json.loads(payload)
        buf = buf[i + n :]
        if data.get("id") == mid:
            return data.get("result", {}).get("result", {}).get("value"), buf


s, buf = connect()
expr_status = """
JSON.stringify({
  t: document.getElementById('audio')?.currentTime,
  engine: document.getElementById('engineState')?.textContent,
  status: document.getElementById('statusNowPlaying')?.textContent,
  src: !!document.getElementById('audio')?.src,
})
"""
val, buf = cdp(s, buf, 1, expr_status)
print("boot", val)

# seek to mid if possible
val, buf = cdp(
    s,
    buf,
    2,
    "(function(){var a=document.getElementById('audio'); if(!a.duration) return 'no-duration'; var t=Math.min(40, Math.floor(a.duration/3)); a.currentTime=t; return 'seeked:'+t+':'+a.duration;})()",
)
print("seek", val)
time.sleep(2)

val, buf = cdp(s, buf, 3, "(function(){window.dispatchEvent(new Event('beforeunload')); var a=document.getElementById('audio'); return String(a.currentTime);})()")
print("saved-at", val)
if STATE.exists():
    j = json.loads(STATE.read_text(encoding="utf-8"))
    print(
        "file",
        {
            "position": j.get("position"),
            "positionPath": j.get("positionPath"),
            "posKeys": list((j.get("positions") or {}).keys())[:3],
            "posVals": list((j.get("positions") or {}).values())[:3],
        },
    )
else:
    print("no state file")
s.close()
