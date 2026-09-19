import json, socket, base64, os, struct, urllib.request

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
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n\r\n"
    ).encode()
)
resp = b""
while b"\r\n\r\n" not in resp:
    resp += s.recv(4096)


def encode_frame(payload, opcode=1):
    mask = os.urandom(4)
    masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
    n = len(payload)
    header = bytes([0x80 | opcode])
    if n < 126:
        header += bytes([0x80 | n])
    elif n < 65536:
        header += bytes([0x80 | 126]) + struct.pack(">H", n)
    else:
        header += bytes([0x80 | 127]) + struct.pack(">Q", n)
    return header + mask + masked


def decode_frame(data):
    if len(data) < 2:
        return None, data
    b1, b2 = data[0], data[1]
    opcode = b1 & 0x0F
    masked = b2 & 0x80
    n = b2 & 0x7F
    idx = 2
    if n == 126:
        n = struct.unpack(">H", data[idx : idx + 2])[0]
        idx += 2
    elif n == 127:
        n = struct.unpack(">Q", data[idx : idx + 8])[0]
        idx += 8
    mask = b""
    if masked:
        mask = data[idx : idx + 4]
        idx += 4
    if len(data) < idx + n:
        return None, data
    payload = data[idx : idx + n]
    if masked:
        payload = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
    return (opcode, payload), data[idx + n :]


def recv_frame(sock, buffer=b""):
    while True:
        frame, buffer = decode_frame(buffer)
        if frame:
            return frame, buffer
        chunk = sock.recv(65536)
        if not chunk:
            raise RuntimeError("closed")
        buffer += chunk


def send_cmd(sock, id, method, params=None, buffer=b""):
    msg = {"id": id, "method": method}
    if params:
        msg["params"] = params
    sock.sendall(encode_frame(json.dumps(msg).encode()))
    while True:
        frame, buffer = recv_frame(sock, buffer)
        opcode, payload = frame
        if opcode == 1:
            data = json.loads(payload.decode())
            if data.get("id") == id:
                return data, buffer


send_cmd(
    s,
    1,
    "Runtime.evaluate",
    {
        "expression": "(function(){var n=document.getElementById('orientTest'); if(n) n.remove(); return 'cleaned';})()",
        "returnByValue": True,
    },
)
send_cmd(s, 2, "Page.reload", {"ignoreCache": True})
print("reloaded ok")
s.close()
