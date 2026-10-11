"""Conservative public-RPC rent estimate; no key contents are read here."""
import json
import os
import pathlib
import subprocess
import urllib.request

rpc_url = os.environ["FUSE_RPC"]
if rpc_url != "https://api.devnet.solana.com":
    raise SystemExit("Only canonical Solana Devnet is permitted.")

def rpc(method, params):
    payload = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    request = urllib.request.Request(rpc_url, payload, {"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=20) as response:
        result = json.load(response)
    if "error" in result:
        raise SystemExit(str(result["error"]))
    return result["result"]

wallet = subprocess.check_output(["solana", "address", "--keypair", os.environ["FUSE_DEPLOYER"]], text=True).strip()
size = pathlib.Path(os.environ["FUSE_BINARY"]).stat().st_size
balance = rpc("getBalance", [wallet, {"commitment": "confirmed"}])["value"]
rents = [rpc("getMinimumBalanceForRentExemption", [length]) for length in [size + 45, size + 37, 36]]
# Count both the temporary buffer and ProgramData even though the buffer rent is
# returned during deployment. Include 0.1 SOL for write fees and test fixtures.
required = sum(rents) + 100_000_000
print(f"Binary: {size} bytes; ProgramData rent: {rents[0] / 1e9:.9f} Devnet SOL")
print(f"Conservative peak requirement including buffer/fees/fixtures: {required / 1e9:.9f} Devnet SOL")
print(f"Available: {balance / 1e9:.9f} Devnet SOL")
if balance < required:
    raise SystemExit(f"STOP: owner must manually add at least {(required - balance) / 1e9:.9f} Devnet SOL. No faucet requested.")
print("Funding sufficient. No wallet configuration changed; no faucet requested.")
