import json
with open('/home/openclaw/workspace/projects/vr-freebuild-staging/test_chain.ged', 'r') as f:
    ged = f.read()
# Output as a JSON-encoded string (safe for JS embedding)
print(json.dumps(ged))