# SysAdmin Report

Document type: Technical operations report
Role: SysAdmin
Incident ID: TR-USB-2026-04-26-001
Created: 2026-04-26 08:05 CEST
Status: Submitted to ISO
Classification: Confidential - Incident Response

## Executive Summary

The affected user account had legitimate read access to the payment-card reconciliation environment. The export was generated through an internal reporting job and copied to an unauthorised USB device from a VDI workstation. No service outage, data corruption, or privilege escalation has been detected. The main operational issue is unauthorised disclosure of customer and payment-card data.

## Affected Systems

- Workstation: BER-VDI-PAYOPS-014
- VDI pool: `PAYOPS-VDI-PROD`
- Application: Payment Reconciliation Portal
- Database read replica: `cards-recon-ro-02.eu-central-1.internal`
- Data source: Card processor settlement feed, customer identity mapping table
- File share involved: None
- Backup systems involved: None
- Production transaction processing: Not affected

## Account and Access Details

- User principal: `trb\mkeller`
- HR status: Active employee at time of incident
- Role: Senior Payment Operations Analyst
- Access group: `PAYOPS_RECON_EXPORT_READ`
- Export entitlement: Enabled
- USB policy exception: None
- Last successful login: 2026-04-26 05:21 CEST
- Account disabled: 2026-04-26 06:16 CEST
- Privileged admin rights: None detected

The user did not have database administrator privileges. The export was possible because the payment reconciliation portal allowed CSV export for authorised operations analysts.

## Timeline From System Logs

| Time CEST | Event |
|---|---|
| 05:21 | User `trb\mkeller` logs into VDI BER-VDI-PAYOPS-014. |
| 05:29 | User opens Payment Reconciliation Portal. |
| 05:34 | Filter applied: settlement period 2026-04-01 to 2026-04-25, active cards only. |
| 05:41 | CSV export job `exp_7f91c2` completed, 18,742 rows. |
| 05:42 | File written to local Downloads folder. |
| 05:43 | USB device attached. |
| 05:43 | DLP alert fires on file copy to removable media. |
| 05:44 | Copy operation completes. |
| 05:46 | User deletes local CSV from Downloads. |
| 05:49 | User logs out of VDI. |
| 06:12 | Badge logs show employee exits Berlin office. |
| 06:16 | Account disabled and sessions revoked. |

## Log Evidence

DLP event ID: `DLP-20260426-054317-8872`

EDR device event:

```text
DeviceName=BER-VDI-PAYOPS-014
ActionType=RemovableStorageFileWritten
InitiatingProcessAccountName=mkeller
FileName=card_recon_export_2026-04-26_0541.csv
SHA256=0db8a6b7e0e4df1f1a7f6d5fc997099fe57b10a91bdce82c8d1c760cab4f1d9d1
RemovableStorageSerialNumber=SNDK-ULTRA-64G-4C530001230417118305
```

Portal audit event:

```text
event=export_completed
export_id=exp_7f91c2
user=trb\mkeller
rows=18742
columns=customer_id,name,email,mobile,address,iban_last4,card_product,pan,expiry,token_id,last_tx_at,risk_flags,account_status
```

## Containment Actions

- Account disabled.
- SSO sessions revoked.
- VDI isolated.
- Reconciliation export permission disabled for `PAYOPS_RECON_EXPORT_READ`.
- New temporary rule added: block exports containing `pan` column unless approved by Payment Security.
- USB write policy changed from monitor-only to block for Payment Operations VDI pool.
- Audit log retention extended for involved systems.

## Operational Impact

Customer-facing banking, brokerage, and card transaction services continue to operate normally. Payment Operations reconciliation work is slowed because exports now require manual approval.

## Remaining Technical Work

- Confirm exact deduplicated customer count.
- Confirm whether exported PANs were full or masked for any subset.
- Confirm whether token mapping can be abused without processor-side credentials.
- Preserve VDI image before recompose.
- Correlate proxy, DNS, and email logs for signs of onward transfer.

## SysAdmin Recommendation

Treat as confirmed data exfiltration unless forensics disproves file contents or copy completion. Continue containment and provide CISO with the current maximum scope: 18,742 customer records including full PAN and contact data.

