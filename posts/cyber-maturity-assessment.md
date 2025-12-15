# Cyber Maturity Assessment

Cyber Maturity Assessment helps organizations understand the maturity of their cybersecurity posture. During my experience working as a consultant in an auditing firm, it was one of the primary mechanisms CISOs used to assess where their organizations stood, as well as a way to justify and secure additional funding from board members for security initiatives.

A cyber maturity assessment should evaluate both **technical implementations** and **governance components**, including policies, documentation, and supporting processes such as ticketing and exception management. For example, when assessing the maturity of the **Access Management** domain, both the technical controls—such as Identity and Access Management (IAM) systems or Active Directory configurations—and the associated access management policies must be evaluated.

In practice, I have frequently observed a significant gap between policy and implementation. In many organizations, access management policies are well-defined and documented in accordance with guidelines, but they are not consistently followed in practice. Conversely, some organizations have technical access restrictions implemented, yet lack the supporting documentation and governance. Clients often question why such scenarios are classified as low maturity or ad hoc when controls are technically “in place.” However, without a governance and accountability structure, there is no assurance that these implementations will be reviewed, consistently enforced, or that exceptions will be properly documented, tracked, and approved.

A key consideration when conducting a cyber maturity assessment is ensuring that an organization’s **crown jewels**, or critical assets, are included in scope and mapped across the relevant security domains. For example, in a data analytics company, the analytics platform that processes client data represents a critical asset. Assessment questions should therefore focus on how the platform is accessed, how data is managed, stored, and protected, and whether appropriate technical controls and documentation exist.

Cyber maturity assessments are typically conducted across domains such as **Access Management, Data Security, Network Security, Logging and Monitoring, Incident Response, and Data Recovery**, with maturity levels graded from **0 to 5**.

---

## Maturity Levels (Encryption Example)

### Level 1 – Ad hoc

At this level, security practices may be performed in an ad hoc manner. The practices are neither consistently implemented nor documented.

**Example:**
- Encryption is not implemented
- There is no encryption policy in place

Based on my experience, even established organizations can be found operating at this maturity level.

---

### Level 2 – Inconsistent and Informal

Security practices are performed inconsistently and rely heavily on individual knowledge rather than formal processes.

**Examples:**
- Some systems use encryption (e.g., HTTPS enabled on a few applications)
- Cloud storage buckets may have encryption enabled due to default settings
- Engineers generally understand that encryption is important, but implementation varies by individual
- No formal encryption policy or standard exists

In my experience, when key technical employees leave the organization, critical knowledge often leaves with them due to the lack of documentation and transparency. While some fragmented processes exist, they are neither repeatable nor embedded into organizational culture.

---

### Level 3 – Defined

At this level, documented procedures, standards, and guidelines are in place.

**Key changes from Level 2 to Level 3:**
- Practices are formally documented
- Expectations are clearly defined
- New teams can follow established processes

**Encryption example:**
- An encryption policy exists
- Standards define approved algorithms
- Procedures explain how to enable encryption
- Enforcement and measurement remain limited

---

### Level 4 – Consistently Followed and Measured

Processes are consistently followed and measured for effectiveness.

**Examples:**
- Key management policies are regularly reviewed and updated
- Metrics are tracked, such as:
  - Percentage of systems encrypted
  - Number of approved exceptions
- Issues are documented and corrective actions are taken

This demonstrates that processes are consistently applied, effectiveness is measured, and management visibility exists.

---

### Level 5 – Optimized (Aspirational)

Level 5 is generally viewed as an **aspirational state** and, in practice, is rarely assigned by auditors or consultants. Continuous improvement implies that there is always scope for further enhancement due to evolving threats, technologies, and business requirements.

---

## Conclusion

Cyber maturity assessments provide organizations with a structured way to understand their cybersecurity posture and prioritize improvement efforts in domains with lower maturity.
