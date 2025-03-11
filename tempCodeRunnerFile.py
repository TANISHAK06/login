import requests
import json

# Test your backend endpoint directly
response = requests.post(
    "http://127.0.0.1:5000/action",
    json={"query": "What's the weather today?"},
    headers={"Content-Type": "application/json"}
)

print(f"Status code: {response.status_code}")
try:
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except:
    print(f"Raw response: {response.text}")