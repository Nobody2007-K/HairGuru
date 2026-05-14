"""
HAIRGURU Frontend Server - Python
Serves static files on port 3000.
"""
import http.server
import os

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class HairGuruHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Serve one.html as the default page
        if self.path == '/' or self.path == '':
            self.path = '/one.html'
        return super().do_GET()

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, format, *args):
        print("  [%s] %s" % (self.log_date_time_string(), format % args))


if __name__ == '__main__':
    with http.server.HTTPServer(('0.0.0.0', PORT), HairGuruHandler) as httpd:
        print("")
        print("  HAIRGURU Frontend Server")
        print("  ----------------------------")
        print("  -> Local:   http://localhost:%d/" % PORT)
        print("  -> Backend: http://localhost:8000/api/")
        print("  ----------------------------")
        print("")
        httpd.serve_forever()
