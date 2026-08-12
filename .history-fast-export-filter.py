import re
import subprocess
import sys

REMOVE_PATH = re.compile(rb"^M [0-7]+ (?:[0-9a-f]{40}|:[0-9]+) (?:google_api_config\.js|backend_code\.js)\n$")
DATA_HEADER = re.compile(rb"^data (\d+)\n$")

source = sys.stdin.buffer
destination = sys.stdout.buffer
while line := source.readline():
    data = DATA_HEADER.match(line)
    if data:
        destination.write(line)
        destination.write(source.read(int(data.group(1))))
    elif not REMOVE_PATH.match(line):
        destination.write(line)
