from concurrent.futures import ThreadPoolExecutor, as_completed
import ipaddress
import json
import os
import socket
import threading
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAMERA_IP_FILE = os.path.join(BASE_DIR, "camera_ip.txt")

_NO_PROXY_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))
_SCAN_LOCK = threading.Lock()


def get_lan_ip() -> str:
    """Return the primary local LAN IPv4 address without sending network traffic."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"
    finally:
        sock.close()


def read_camera_ip_file() -> str:
    """Read the persisted camera IP address from disk, or return an empty string."""
    try:
        if os.path.exists(CAMERA_IP_FILE):
            with open(CAMERA_IP_FILE, "r", encoding="utf-8") as f:
                return f.read().strip()
    except Exception:
        pass
    return ""


def write_camera_ip_file(ip_address: str) -> None:
    """Persist the camera IP atomically so sibling processes never read a partial file."""
    cleaned = ip_address.strip()
    if not cleaned:
        try:
            if os.path.exists(CAMERA_IP_FILE):
                os.remove(CAMERA_IP_FILE)
        except OSError:
            pass
        return

    tmp_path = f"{CAMERA_IP_FILE}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        f.write(cleaned)
    os.replace(tmp_path, CAMERA_IP_FILE)


def _fetch_text(url: str, timeout: float) -> tuple[int, str]:
    req = urllib.request.Request(url, method="GET")
    with _NO_PROXY_OPENER.open(req, timeout=timeout) as resp:
        return resp.status, resp.read(2048).decode("utf-8", errors="ignore")


def is_esp32_camera(
    ip: str,
    tcp_timeout: float = 0.8,
    http_timeout: float = 1.2,
) -> bool:
    """Verify whether the given IP hosts an ESP32-CAM CameraWebServer HTTP endpoint."""
    ip = (ip or "").strip()
    if not ip:
        return False

    try:
        ipaddress.IPv4Address(ip)
    except ValueError:
        return False

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.settimeout(tcp_timeout)
        if sock.connect_ex((ip, 80)) != 0:
            return False
    except OSError:
        return False
    finally:
        sock.close()

    # Check custom firmware endpoint first, then fallback to standard CameraWebServer /status JSON.
    try:
        status_code, body = _fetch_text(f"http://{ip}/serverinfo", timeout=http_timeout)
        if status_code == 200 and "python_port=" in body and "net_port=" in body:
            return True
    except Exception:
        pass

    try:
        status_code, body = _fetch_text(f"http://{ip}/status", timeout=http_timeout)
        if status_code == 200:
            data = json.loads(body)
            if isinstance(data, dict) and {"xclk", "pixformat", "framesize", "quality"}.issubset(data.keys()):
                return True
    except Exception:
        pass

    return False


def discover_camera_ip(preferred_ip: str = "", lan_ip: str | None = None) -> str:
    """Return a verified ESP32-CAM IP, scanning the local /24 subnet if needed."""
    with _SCAN_LOCK:
        candidates = []
        for candidate in (preferred_ip.strip(), read_camera_ip_file()):
            if candidate and candidate not in candidates:
                candidates.append(candidate)

        for candidate in candidates:
            if is_esp32_camera(candidate, tcp_timeout=0.6, http_timeout=1.0):
                write_camera_ip_file(candidate)
                return candidate

        local_ip = (lan_ip or get_lan_ip()).strip()
        try:
            local_addr = ipaddress.IPv4Address(local_ip)
        except ValueError:
            write_camera_ip_file("")
            return ""

        if local_addr.is_loopback:
            write_camera_ip_file("")
            return ""

        network = ipaddress.IPv4Network(f"{local_ip}/24", strict=False)
        hosts = [str(host) for host in network.hosts() if str(host) != local_ip]

        found_ip = ""
        executor = ThreadPoolExecutor(max_workers=48)
        futures = {executor.submit(is_esp32_camera, host): host for host in hosts}
        try:
            for future in as_completed(futures):
                host = futures[future]
                try:
                    if future.result():
                        found_ip = host
                        break
                except Exception:
                    continue
        finally:
            for future in futures:
                future.cancel()
            executor.shutdown(wait=True, cancel_futures=True)

        write_camera_ip_file(found_ip)
        return found_ip
