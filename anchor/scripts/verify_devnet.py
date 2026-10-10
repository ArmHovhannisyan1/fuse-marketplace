"""Read-only checks of committed public evidence against canonical Devnet RPC."""
import json
import pathlib
import time
import urllib.request

root = pathlib.Path(__file__).resolve().parents[2]
proof = json.loads((root / "docs/devnet-proof.json").read_text())
deployment = json.loads((root / "docs/devnet-deployment.json").read_text())
rpc_url = "https://api.devnet.solana.com"
assert proof["rpc"] == rpc_url
assert deployment["rpc"] == rpc_url and deployment["programId"] == proof["programId"]

def rpc(method, params):
    time.sleep(0.5)
    request = urllib.request.Request(rpc_url, json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(), {"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=20) as response:
        result = json.load(response)
    if "error" in result:
        raise RuntimeError(f"{method}: {result['error']}")
    return result["result"]

assert rpc("getGenesisHash", []) == proof["genesisHash"] == "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG"
program = rpc("getAccountInfo", [proof["programId"], {"encoding": "base64", "commitment": "confirmed"}])["value"]
assert program["executable"] and program["owner"] == "BPFLoaderUpgradeab1e11111111111111111111111"
deployed = rpc("getSignatureStatuses", [[deployment["signature"]], {"searchTransactionHistory": True}])["value"][0]
assert deployed and deployed["err"] is None and deployed["confirmationStatus"] in ["confirmed", "finalized"]
records = proof["transactions"]
statuses = rpc("getSignatureStatuses", [[record["signature"] for record in records], {"searchTransactionHistory": True}])["value"]
for record, status in zip(records, statuses, strict=True):
    assert status and status["confirmationStatus"] in ["confirmed", "finalized"], record["label"]
    assert status["err"] == record["error"], record["label"]
print(f"Verified {len(records)} genuine transactions, including the recorded expected failures.")

def transaction(sig):
    tx = rpc("getTransaction", [sig, {"encoding": "jsonParsed", "commitment": "confirmed", "maxSupportedTransactionVersion": 0}])
    assert tx and tx["meta"]["err"] is None
    return tx

def tokens(tx, which, account):
    keys = tx["transaction"]["message"]["accountKeys"]
    index = next(i for i, key in enumerate(keys) if key["pubkey"] == account)
    balance = next(item for item in tx["meta"][which] if item["accountIndex"] == index)
    assert balance["mint"] == proof["mint"] and balance["uiTokenAmount"]["decimals"] == 6
    return int(balance["uiTokenAmount"]["amount"])

activation = transaction(proof["success"]["activationSignature"])
for account, allocation in [(proof["venueToken"], 80_000_000), (proof["instructorToken"], 120_000_000)]:
    assert tokens(activation, "postTokenBalances", account) - tokens(activation, "preTokenBalances", account) == allocation
assert tokens(activation, "preTokenBalances", proof["success"]["vault"]) == 200_000_000
assert tokens(activation, "postTokenBalances", proof["success"]["vault"]) == 0
refund = transaction(proof["expiry"]["refundSignature"])
assert tokens(refund, "postTokenBalances", proof["attendeeToken"]) - tokens(refund, "preTokenBalances", proof["attendeeToken"]) == 40_000_000
assert tokens(refund, "postTokenBalances", proof["expiry"]["vault"]) == 0
assert any(key["pubkey"] == proof["attendee"] and key["signer"] for key in refund["transaction"]["message"]["accountKeys"])
for label, supplier in [("A: Authentic venue approval", proof["venue"]), ("A: Authentic instructor approval", proof["instructor"])]:
    record = next(record for record in records if record["label"] == label)
    approved = transaction(record["signature"])
    assert any(key["pubkey"] == supplier and key["signer"] for key in approved["transaction"]["message"]["accountKeys"])
for scenario in ["success", "expiry"]:
    assert rpc("getTokenAccountBalance", [proof[scenario]["vault"], {"commitment": "confirmed"}])["value"]["amount"] == "0"
print("VERIFIED: exact 80/120 payouts, zero settled vaults, authentic supplier signatures, contributor-signed 40-token refund.")
browser_path = root / "docs/devnet-browser-proof.json"
if browser_path.exists():
    browser = json.loads(browser_path.read_text())
    assert browser["rpc"] == rpc_url and browser["programId"] == proof["programId"]
    browser_tx = transaction(browser["signature"])
    assert any(key["pubkey"] == browser["signer"] and key["signer"] for key in browser_tx["transaction"]["message"]["accountKeys"])
    for account, allocation in [(proof["venueToken"], 80_000_000), (proof["instructorToken"], 120_000_000)]:
        assert tokens(browser_tx, "postTokenBalances", account) - tokens(browser_tx, "preTokenBalances", account) == allocation
        current = int(rpc("getTokenAccountBalance", [account, {"commitment": "confirmed"}])["value"]["amount"])
        print(f"Current supplier balance {account}: {current} base units (six decimals)")
    print("VERIFIED: authentic browser signer and second exact 80/120 payout.")
