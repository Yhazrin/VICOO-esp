# Compliance Checklist / 合规检查清单

**Document Version:** 1.0
**Last Updated:** 2026-03-19
**Applicable Entities:** Tonghua Public Welfare x Sustainable Fashion ("the Platform", "本平台")
**Owner:** Legal & Compliance Officer (legal-compl) + Security Engineer (security-eng)
**Review Cycle:** Quarterly + Pre-launch mandatory gate

---

## How to Use This Checklist

- Status values: `[ ]` Not Started | `[-]` In Progress | `[x]` Completed | `[N/A]` Not Applicable
- Each item includes: responsible agent, verification method, and due phase
- **Pre-launch gate:** ALL items marked `[P0]` must be `[x]` before launch approval
- Document references link to the corresponding policy files in `docs/security/`

---

## 1. PIPL (个人信息保护法) Compliance

### 1.1 Legal Basis and Consent

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| PIPL-01 | Privacy Policy published and accessible from all entry points (Web, Mini Program, Android) | P0 | legal-compl + react-fe | Manual review of all entry points | 1 |
| PIPL-02 | Privacy Policy covers all required disclosures per PIPL Articles 17, 30: processor identity, contact, purpose, method, data categories, retention, rights | P0 | legal-compl | Legal review against PIPL checklist | 1 |
| PIPL-03 | Consent collection mechanism implemented (separate consent for sensitive data, cross-border transfer, public disclosure) | P0 | backend-arch + security-eng | Code review + functional test | 2 |
| PIPL-04 | Consent withdrawal mechanism implemented and functional (within 15 business days) | P0 | backend-arch | Functional test | 2 |
| PIPL-05 | Personal information processing rules are explainable upon user request | P1 | legal-compl | Process documentation | 2 |
| PIPL-06 | Personal Information Protection Impact Assessment (PIPIA) completed and documented | P0 | legal-compl + security-eng | Assessment report | 1 |
| PIPL-07 | Separate consent obtained before processing sensitive personal information (biometrics, health, financial, minors' data) | P0 | backend-arch | Code review + consent log audit | 2 |

### 1.2 Data Subject Rights

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| PIPL-08 | Right to access: user can view all personal information held | P0 | react-fe + backend-arch | Functional test | 2 |
| PIPL-09 | Right to copy: user can export personal information in machine-readable format | P1 | backend-arch | Functional test | 2 |
| PIPL-10 | Right to correction: user can request correction; processed within 15 business days | P0 | backend-arch | Functional test | 2 |
| PIPL-11 | Right to deletion: user can request deletion; processed within 15 business days | P0 | backend-arch | Functional test + data verification | 2 |
| PIPL-12 | Right to withdraw consent: withdrawal mechanism available and functional | P0 | react-fe + backend-arch | Functional test | 2 |
| PIPL-13 | Right to delete account: account deletion completed within 15 business days | P0 | backend-arch | Functional test | 2 |
| PIPL-14 | Right to explanation: process exists for responding to processing rule inquiries | P1 | legal-compl | Process documentation | 2 |
| PIPL-15 | Right to data portability: mechanism to transfer data to another processor | P2 | backend-arch | API design review | 3 |
| PIPL-16 | Rights of deceased user's close relatives (access, correction, deletion) | P1 | backend-arch + legal-compl | Process documentation | 2 |

### 1.3 Cross-Border Data Transfer

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| PIPL-17 | Cross-border transfer impact assessment completed (if applicable) | P0 | security-eng + legal-compl | Assessment report | 1 |
| PIPL-18 | Standard contract with overseas data recipient signed (if applicable) | P0 | legal-compl | Contract document | 1 |
| PIPL-19 | Security assessment filed with CAC (if data volume thresholds are met) | P0 | security-eng | Filing confirmation | 1 |
| PIPL-20 | All data stored within PRC territory by default | P0 | devops + backend-arch | Infrastructure audit | 1 |

### 1.4 Data Processor Obligations

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| PIPL-21 | Data Processing Agreements (DPAs) signed with all third-party processors | P0 | legal-compl | Contract inventory | 1 |
| PIPL-22 | Data protection officer (DPO) or responsible person designated and contactable | P0 | legal-compl | Organizational chart + contact info | 1 |
| PIPL-23 | Security incident response plan with 72-hour regulatory notification capability | P0 | security-eng | Plan document + tabletop exercise | 1 |
| PIPL-24 | Regular compliance audits conducted (at least annually) | P1 | legal-compl + security-eng | Audit reports | 3 |

---

## 2. GDPR Compliance (International Visitors)

### 2.1 Lawful Basis and Transparency

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| GDPR-01 | English version of Privacy Policy available and GDPR-compliant | P0 | legal-compl | Legal review | 1 |
| GDPR-02 | Lawful basis identified for each processing activity (consent, contract, legitimate interest, legal obligation) | P0 | legal-compl | Processing register | 1 |
| GDPR-03 | Consent mechanisms meet GDPR requirements (freely given, specific, informed, unambiguous, withdrawable) | P0 | security-eng + backend-arch | UX audit + code review | 2 |
| GDPR-04 | Legitimate interest assessments (LIAs) documented where legitimate interest is the lawful basis | P1 | legal-compl | LIA documents | 1 |
| GDPR-05 | Cookie consent banner implemented (opt-in model for non-essential cookies) | P0 | react-fe + ux-arch | Functional test | 2 |
| GDPR-06 | Privacy notice meets GDPR Articles 13/14 requirements | P0 | legal-compl | Legal review | 1 |

### 2.2 Data Subject Rights (Articles 15-22)

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| GDPR-07 | Right of access (Article 15): response within one month | P0 | backend-arch | Functional test | 2 |
| GDPR-08 | Right to rectification (Article 16): response within one month | P0 | backend-arch | Functional test | 2 |
| GDPR-09 | Right to erasure (Article 17): response within one month | P0 | backend-arch | Functional test | 2 |
| GDPR-10 | Right to restriction (Article 18): processing restriction mechanism | P1 | backend-arch | Functional test | 2 |
| GDPR-11 | Right to data portability (Article 20): export in structured, machine-readable format (JSON/CSV) | P1 | backend-arch | Functional test | 2 |
| GDPR-12 | Right to object (Article 21): objection mechanism for legitimate interest processing | P1 | backend-arch | Functional test | 2 |
| GDPR-13 | Automated decision-making transparency (Article 22): no solely automated decisions with legal effects | P1 | security-eng | Process audit | 2 |

### 2.3 International Data Transfers

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| GDPR-14 | Standard Contractual Clauses (SCCs) executed for EU-to-China transfers | P0 | legal-compl | Contract document | 1 |
| GDPR-15 | Transfer Impact Assessment (TIA) completed | P0 | security-eng + legal-compl | Assessment report | 1 |
| GDPR-16 | Supplementary technical measures implemented (encryption, pseudonymization, access controls) | P0 | security-eng | Technical audit | 2 |
| GDPR-17 | Data Protection Officer (DPO) designated and contact information published | P0 | legal-compl | Contact info published | 1 |

### 2.4 Accountability

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| GDPR-18 | Records of Processing Activities (RoPA) maintained | P0 | legal-compl | Document review | 1 |
| GDPR-19 | Data Protection Impact Assessments (DPIAs) conducted for high-risk processing | P0 | security-eng + legal-compl | DPIA reports | 1 |
| GDPR-20 | Data breach notification procedure (72-hour supervisory authority notification) | P0 | security-eng | Plan document | 1 |
| GDPR-21 | Data Processing Agreements (Article 28) with all processors | P0 | legal-compl | Contract inventory | 1 |

---

## 3. Child Data Protection Verification

### 3.1 Age Verification and Guardian Consent

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| CHILD-01 | Age verification mechanism implemented at registration | P0 | backend-arch + security-eng | Functional test | 2 |
| CHILD-02 | Guardian consent workflow implemented (electronic signature + audit trail) | P0 | backend-arch | Functional test + audit log review | 2 |
| CHILD-03 | Guardian consent covers all required elements (data types, purpose, scope, duration, rights) | P0 | legal-compl | Consent form review | 1 |
| CHILD-04 | Consent withdrawal mechanism functional for guardians | P0 | backend-arch | Functional test | 2 |
| CHILD-05 | Consent re-collection when processing changes | P0 | backend-arch | Code review | 2 |

### 3.2 Data Isolation and Access Control

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| CHILD-06 | Children's data stored in separate encrypted tablespace | P0 | backend-arch + security-eng | Database audit | 2 |
| CHILD-07 | Independent encryption key for children's data | P0 | security-eng | Key management audit | 2 |
| CHILD-08 | Secondary approval workflow for accessing children's data | P0 | backend-arch + security-eng | Functional test + audit log review | 2 |
| CHILD-09 | Time-limited access grants (default 2 hours) | P0 | backend-arch | Functional test | 2 |
| CHILD-10 | Comprehensive audit logging for all children's data access | P0 | security-eng | Audit log verification | 2 |
| CHILD-11 | No real children's data in non-production environments | P0 | devops + backend-arch | Environment audit | 3 |
| CHILD-12 | Data anonymization rules for dev/test environments defined and enforced | P1 | backend-arch | Code review | 2 |

### 3.3 Display Restrictions

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| CHILD-13 | Only aliases/nicknames displayed (no real names) | P0 | react-fe + ui-designer | Manual review of all display surfaces | 2 |
| CHILD-14 | No school names, precise locations, or identifiable info displayed | P0 | react-fe + ui-designer | Manual review | 2 |
| CHILD-15 | EXIF metadata stripped from uploaded artwork images | P0 | backend-arch | Functional test (upload image, verify EXIF removal) | 2 |
| CHILD-16 | No upload timestamps (day-level or below) displayed publicly | P1 | react-fe | UI audit | 2 |
| CHILD-17 | Watermark applied to children's artwork images | P1 | backend-arch | Functional test | 2 |

### 3.4 Data Retention and Deletion

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| CHILD-18 | Automated deletion schedule implemented (180 days post-program for participant data) | P0 | backend-arch | Code review + scheduled job verification | 2 |
| CHILD-19 | Artwork removal within 30 days post-authorization expiry | P0 | backend-arch | Functional test | 2 |
| CHILD-20 | Guardian-requested deletion completed within 15 business days | P0 | backend-arch | Functional test | 2 |
| CHILD-21 | Deletion verification: data irrecoverable from primary DB, backups, and caches | P0 | security-eng | Data recovery test | 3 |

---

## 4. Payment Compliance

### 4.1 Payment Provider Compliance

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| PAY-01 | WeChat Pay integration follows WeChat Pay Merchant Platform requirements | P0 | backend-arch + wechat-dev | Sandbox testing | 2 |
| PAY-02 | Alipay integration follows Alipay Open Platform requirements | P0 | backend-arch + android-dev | Sandbox testing | 2 |
| PAY-03 | Stripe integration complies with PCI-DSS (via Stripe Elements, no direct card handling) | P0 | backend-arch | PCI-DSS SAQ-A verification | 2 |
| PAY-04 | PayPal integration follows PayPal REST API requirements | P0 | backend-arch | Sandbox testing | 2 |
| PAY-05 | Payment callback signature verification implemented for all providers | P0 | security-eng + backend-arch | Code review + functional test | 2 |
| PAY-06 | Amount tampering protection implemented (server-side amount validation) | P0 | security-eng + backend-arch | Penetration test | 2 |

### 4.2 Financial Compliance

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| PAY-07 | Transaction records retained for minimum 5 years | P0 | backend-arch | Database retention policy review | 2 |
| PAY-08 | Financial audit trail for all transactions (donations + purchases) | P0 | backend-arch | Audit log verification | 2 |
| PAY-09 | Donation receipt issuance mechanism implemented | P0 | backend-arch | Functional test | 2 |
| PAY-10 | Refund mechanism implemented and tested | P0 | backend-arch | Functional test | 2 |
| PAY-11 | VAT/tax calculation correct (if applicable) | P1 | backend-arch | Test with known tax rates | 2 |

### 4.3 Anti-Fraud

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| PAY-12 | Rate limiting on payment endpoints | P0 | security-eng | Load test | 2 |
| PAY-13 | Suspicious transaction detection (multiple failed payments, unusual amounts) | P1 | security-eng | Rule implementation review | 3 |
| PAY-14 | Payment amount validation (both client-side and server-side) | P0 | backend-arch + security-eng | Penetration test | 2 |

---

## 5. Security Controls Verification

### 5.1 Authentication and Authorization

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| SEC-01 | JWT access token with 15-minute expiry | P0 | security-eng | Code review + token inspection | 2 |
| SEC-02 | JWT refresh token with 7-day expiry and rotation | P0 | security-eng | Code review | 2 |
| SEC-03 | Refresh token rotation on use (old token invalidated) | P0 | security-eng | Functional test | 2 |
| SEC-04 | RBAC permission model implemented and enforced | P0 | security-eng + backend-arch | Code review + permission test | 2 |
| SEC-05 | ABAC policies for fine-grained access (e.g., child data access) | P0 | security-eng | Code review + permission test | 2 |
| SEC-06 | Password hashing with bcrypt (cost factor >= 12) | P0 | security-eng | Code review | 2 |
| SEC-07 | Brute force protection (account lockout after N failed attempts) | P0 | security-eng | Functional test | 2 |
| SEC-08 | WeChat login: code2Session server-side verification | P0 | wechat-dev + security-eng | Code review | 2 |

### 5.2 API Security

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| SEC-09 | Global rate limiting (1000 QPS) | P0 | security-eng | Load test | 2 |
| SEC-10 | Per-user rate limiting (60 QPM) | P0 | security-eng | Load test | 2 |
| SEC-11 | HMAC-SHA256 request signing for sensitive endpoints | P0 | security-eng | Code review + functional test | 2 |
| SEC-12 | Input validation and sanitization on all endpoints | P0 | backend-arch + security-eng | Penetration test | 2 |
| SEC-13 | SQL injection prevention (parameterized queries only) | P0 | backend-arch + security-eng | Code review + SQL injection test | 2 |
| SEC-14 | XSS prevention (output encoding, CSP headers) | P0 | security-eng + react-fe | XSS test | 2 |
| SEC-15 | CORS properly configured (whitelist origins) | P0 | security-eng | Header inspection | 2 |
| SEC-16 | Security headers present (HSTS, X-Frame-Options, X-Content-Type-Options, etc.) | P0 | security-eng | Header inspection | 2 |
| SEC-17 | API documentation does not expose internal implementation details | P1 | tech-writer | Documentation review | 3 |

### 5.3 Data Encryption

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| SEC-18 | TLS 1.3 enforced on all connections | P0 | security-eng + devops | SSL/TLS scan (e.g., ssllabs.com) | 3 |
| SEC-19 | AES-256-GCM encryption for sensitive data at rest (ID numbers, phone numbers, bank cards) | P0 | security-eng | Code review + data audit | 2 |
| SEC-20 | Encryption key management via KMS with regular rotation | P0 | security-eng + devops | KMS configuration audit | 2 |
| SEC-21 | Database connections use TLS | P0 | devops + backend-arch | Connection string audit | 2 |
| SEC-22 | Backup data encrypted | P0 | devops | Backup configuration audit | 2 |
| SEC-23 | Sensitive data masked in logs | P0 | backend-arch + security-eng | Log audit | 2 |

### 5.4 Infrastructure Security

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| SEC-24 | Network segmentation (DMZ, application tier, data tier) | P0 | devops | Network diagram review | 1 |
| SEC-25 | Firewall rules restricted to necessary ports only | P0 | devops | Firewall config audit | 2 |
| SEC-26 | Regular vulnerability scanning (at least monthly) | P1 | security-eng | Scan reports | 3 |
| SEC-27 | Annual penetration testing by third party | P1 | security-eng | Pen test report | 3 |
| SEC-28 | Security logging and monitoring (SIEM or equivalent) | P0 | devops + security-eng | Dashboard verification | 2 |
| SEC-29 | Incident response plan documented and tested | P0 | security-eng | Plan document + tabletop exercise | 1 |

---

## 6. Legal Document Verification

| ID | Item | Priority | Responsible | Verification | Phase |
|----|------|----------|------------|-------------|-------|
| LEGAL-01 | Privacy Policy (`docs/security/privacy-policy.md`) completed and reviewed | P0 | legal-compl | Document exists + legal review | 1 |
| LEGAL-02 | Child Protection Policy (`docs/security/child-protection-policy.md`) completed and reviewed | P0 | legal-compl | Document exists + legal review | 1 |
| LEGAL-03 | Donation Agreement (`docs/security/donation-agreement.md`) completed and reviewed | P0 | legal-compl | Document exists + legal review | 1 |
| LEGAL-04 | User Agreement (`docs/security/user-agreement.md`) completed and reviewed | P0 | legal-compl | Document exists + legal review | 1 |
| LEGAL-05 | All legal documents available in both Chinese and English | P0 | legal-compl | Bilingual verification | 1 |
| LEGAL-06 | Legal documents accessible from all platform entry points (footer links, registration flow) | P0 | react-fe + wechat-dev + android-dev | Manual review of all entry points | 2 |
| LEGAL-07 | Version control and change tracking for all legal documents | P1 | legal-compl | Git history review | 1 |
| LEGAL-08 | Legal review by qualified attorney (recommended for launch) | P1 | legal-compl | Attorney review letter | 3 |

---

## 7. Pre-Launch Compliance Gate

**ALL items below must be `[x]` before the platform can be approved for launch.**

| Gate Item | Linked Checklist Items | Owner | Status |
|-----------|----------------------|-------|--------|
| Privacy Policy approved and published | LEGAL-01, LEGAL-05, LEGAL-06 | legal-compl | [ ] |
| Child Protection Policy approved and published | LEGAL-02, LEGAL-05, LEGAL-06 | legal-compl | [ ] |
| PIPL compliance verified | All PIPL-xx items marked P0 | legal-compl + security-eng | [ ] |
| GDPR compliance verified (for international access) | All GDPR-xx items marked P0 | legal-compl + security-eng | [ ] |
| Child data protection verified | All CHILD-xx items marked P0 | security-eng + backend-arch | [ ] |
| Payment sandbox testing passed for all providers | PAY-01 through PAY-06 | backend-arch | [ ] |
| Authentication and authorization verified | SEC-01 through SEC-08 | security-eng | [ ] |
| API security verified | SEC-09 through SEC-16 | security-eng | [ ] |
| Data encryption verified | SEC-18 through SEC-23 | security-eng | [ ] |
| TLS 1.3 enforced | SEC-18 | devops + security-eng | [ ] |
| Security incident response plan tested | SEC-29, PIPL-23 | security-eng | [ ] |
| Security incident response plan with 72-hour notification | GDPR-20, PIPL-23 | security-eng | [ ] |
| DPA signed with all third-party processors | PIPL-21, GDPR-21 | legal-compl | [ ] |
| No real children's data in non-production environments | CHILD-11 | devops + backend-arch | [ ] |

### Launch Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Legal & Compliance Officer | _________________ | _________________ | ________ |
| Security Engineer | _________________ | _________________ | ________ |
| Backend Architect | _________________ | _________________ | ________ |
| Project Lead (Orchestrator) | _________________ | _________________ | ________ |

**Launch approved: [ ] Yes [ ] No**

**Conditions (if any):** _______________________________________________

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-19 | legal-compl | Initial version |

---

*End of Compliance Checklist / 合规检查清单结束*
