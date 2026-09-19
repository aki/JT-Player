import json, socket, base64, os, struct, urllib.request, time

info = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list"))
page = next(i for i in info if i.get("type") == "page" and "index.html" in i.get("url", ""))
url = page["webSocketDebuggerUrl"]
hostport, path = url[5:].split("/", 1)
host, port = hostport.split(":")
port = int(port)
path = "/" + path
key = base64.b64encode(os.urandom(16)).decode()
s = socket.create_connection((host, port), timeout=10)
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

buf = b""


def enc(p):
    m = os.urandom(4)
    x = bytes(b ^ m[i % 4] for i, b in enumerate(p))
    n = len(p)
    h = bytes([0x81])
    h += bytes([0x80 | n]) if n < 126 else bytes([0x80 | 126]) + struct.pack(">H", n)
    return h + m + x


def cdp(mid, expr):
    global buf
    s.sendall(
        enc(
            json.dumps(
                {
                    "id": mid,
                    "method": "Runtime.evaluate",
                    "params": {"expression": expr, "returnByValue": True},
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
        if data.get("id") == mid:
            return data.get("result", {}).get("result", {}).get("value")
        buf = buf[i + n :]


SNIP = """
(() => {
  const btn = document.getElementById('btnPlay');
  const play = document.getElementById('iconPlay');
  const pause = document.getElementById('iconPause');
  const vis = (el) => getComputedStyle(el).display !== 'none';
  return JSON.stringify({
    btnClass: btn.className,
    playVisible: vis(play),
    pauseVisible: vis(pause),
    both: vis(play) && vis(pause),
  });
})()
"""

print("before", cdp(1, SNIP))
print("click", cdp(2, "document.getElementById('btnPlay').click(); document.getElementById('btnPlay').className"))
time.sleep(0.5)
print("after", cdp(3, SNIP))
s.close()
