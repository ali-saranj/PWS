# Spec Delta: storefront/navigation

## MODIFIED Requirements

### Requirement: Responsive Brand Header
The storefront header SHALL display a compact brand identity "دهکده پروتئین" on mobile viewports (< 768px), the full brand name "دهکده پروتئین اصفهان" and specialty product slogan on desktop viewports (>= 768px), and an express delivery badge for Isfahan.

#### Scenario: Mobile viewport renders compact brand text
- **WHEN** the user views the storefront on a mobile screen (< 768px)
- **THEN** the header displays the brand logo icon and concise title "دهکده پروتئین" without horizontal overflow.

#### Scenario: Desktop viewport renders full brand title and subtitle
- **WHEN** the user views the storefront on a desktop screen (>= 768px)
- **THEN** the header displays "دهکده پروتئین اصفهان - فروشگاه تخصصی فرآورده‌های پروتئینی" along with the descriptive subtitle highlighting sausages, cold cuts, cheeses, sauces, and pickles.

#### Scenario: Header displays express delivery badge for Isfahan
- **WHEN** the user views the sub-navigation bar on desktop or the mobile drawer
- **THEN** the header displays the delivery badge "اصفهان - ارسال سریع با بسته‌بندی عایق".
