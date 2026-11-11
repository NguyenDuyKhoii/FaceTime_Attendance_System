import socket
import time

from camera_discovery import get_lan_ip, read_camera_ip_file

DISCOVERY_PORT = 45678
MAGIC = "ATTENDANCE_SERVER"
SERVER_PORT = 8000  # port FastAPI đang chạy


def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    # Gửi broadcast định kỳ
    while True:
        ip = get_lan_ip()
        camera_ip = read_camera_ip_file()
        if camera_ip:
            msg = f"{MAGIC} ip={ip} port={SERVER_PORT} camera_ip={camera_ip} camera_port=81".encode("utf-8")
        else:
            msg = f"{MAGIC} ip={ip} port={SERVER_PORT}".encode("utf-8")

        sock.sendto(msg, ("255.255.255.255", DISCOVERY_PORT))
        print("Broadcast:", msg.decode())
        time.sleep(1)


if __name__ == "__main__":
    main()
