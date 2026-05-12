"""
LifeOS Local Dev Server with OpenCode Go API proxy.
Serves static files AND proxies AI API calls to bypass CORS.
Usage: python server.py
"""
import http.server
import json
import urllib.request
import urllib.error
import os
import sys
from pathlib import Path

PORT = 5500
STATIC_DIR = Path(__file__).parent
OPENCODE_BASE = 'https://opencode.ai/zen/go/v1/chat/completions'


class LifeOSHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def do_POST(self):
        if self.path == '/api/chat':
            self._proxy_to_opencode()
        else:
            super().do_POST()

    def _proxy_to_opencode(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        try:
            request_data = json.loads(body)
        except json.JSONDecodeError:
            self._send_json(400, {'error': 'Invalid JSON'})
            return

        api_key = self.headers.get('X-API-Key', '')

        req = urllib.request.Request(
            OPENCODE_BASE,
            data=json.dumps(request_data).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + api_key
            },
            method='POST'
        )

        try:
            with urllib.request.urlopen(req) as resp:
                response_body = resp.read()
                self.send_response(resp.status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response_body)
        except urllib.error.HTTPError as e:
            error_body = e.read()
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(error_body)
        except Exception as e:
            self._send_json(502, {'error': 'Proxy error: ' + str(e)})

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')
        self.end_headers()

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def _send_json(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def log_message(self, format, *args):
        # Cleaner logging
        sys.stderr.write('[%s] %s\n' % (self.log_date_time_string(), format % args))


if __name__ == '__main__':
    print('=' * 50)
    print('  LifeOS Dev Server + OpenCode Go API Proxy')
    print('  http://localhost:' + str(PORT))
    print('=' * 50)
    with http.server.HTTPServer(('', PORT), LifeOSHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nServer stopped.')
