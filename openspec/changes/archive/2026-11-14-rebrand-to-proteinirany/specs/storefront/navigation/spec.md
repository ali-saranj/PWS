# Spec Delta

## MODIFIED Requirements

### Requirement: Responsive Brand Header
The storefront header SHALL display a compact brand identity on mobile viewports (< 768px) and the full brand name and slogan on desktop viewports (>= 768px).

#### Scenario: Mobile viewport renders compact brand text
- **WHEN** the user views the storefront on a mobile screen (< 768px)
- **THEN** the header displays the brand logo icon and concise title "پروتئین ایرانی" without horizontal overflow.

#### Scenario: Desktop viewport renders full brand title and subtitle
- **WHEN** the user views the storefront on a desktop screen (>= 768px)
- **THEN** the header displays "پروتئین ایرانی - فروشگاه تخصصی فرآورده‌های پروتئینی" along with the descriptive subtitle.
