# Ennitant User Flow

```mermaid
flowchart TD
    A[Landing Page] --> B[Get Started]
    B --> C[Signup]
    C --> D[Phone + Password]
    D --> E[OTP Verification]
    E --> F[Business Information]
    F --> G[WhatsApp Verification]
    G --> H[Dashboard]

    H --> I[Customer Order Link]
    H --> J[Vendor Dispatch Link]
    H --> K[Real-Time Orders]

    I --> L[Customer]
    L --> M[WhatsApp]
    M --> N[Order Processing]
    N --> K

    J --> O[Vendor Portal]
    O --> P[Mark Dispatched]
    P --> K
```

## Notes

- n8n, Meta tokens, webhook URLs, and database IDs stay hidden from the UI.
- OTP codes are logged by the API when `OTP_DEV_MODE=true`.
- Customer page: `/order/{businessSlug}`
- Vendor page: `/vendor/{secureToken}`
