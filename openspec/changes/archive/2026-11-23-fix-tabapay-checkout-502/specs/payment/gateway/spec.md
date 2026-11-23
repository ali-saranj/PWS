# Spec Delta: payment/gateway

## MODIFIED Requirements

### Requirement: Multi-Provider Payment Initiation
The system SHALL support initiating online payments through either TabaPay or Zarinpal based on the active provider configuration without altering the customer checkout API contract, supporting configurable sandbox environments and structured upstream failure diagnostics.

#### Scenario: Checkout initiates payment with active TabaPay gateway
- **WHEN** customer checks out an order while active gateway is configured as TABAPAY
- **THEN** system reserves inventory, requests payment token from TabaPay create API (or sandbox create API when sandbox is active), records payment with gateway TABAPAY and token authority, and returns payment redirection URL

#### Scenario: Gateway API failure during initiation
- **WHEN** active payment gateway API returns an error (such as deactivated gateway or domain mismatch) or times out during checkout
- **THEN** system logs the upstream gateway error code and message, rejects checkout with a bilingual RFC 7807 API exception containing clear localized explanation, and leaves inventory uncommitted

#### Scenario: Gateway sandbox environment configuration
- **WHEN** application is configured in development or test mode with sandbox enabled
- **THEN** system routes payment requests to the gateway's sandbox create endpoint and generates valid test payment redirection URLs
