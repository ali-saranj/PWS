# payment/gateway Specification

## Purpose
Provides a multi-provider payment gateway system supporting TabaPay and Zarinpal to enable secure online card transactions with configurable routing, stock integrity, and idempotent verification.

## Requirements

### Requirement: Multi-Provider Payment Initiation
The system SHALL support initiating online payments through either TabaPay or Zarinpal based on the active provider configuration without altering the customer checkout API contract.

#### Scenario: Checkout initiates payment with active TabaPay gateway
- **WHEN** customer checks out an order while active gateway is configured as TABAPAY
- **THEN** system reserves inventory, requests payment token from TabaPay create API, records payment with gateway TABAPAY and token authority, and returns payment redirection URL

#### Scenario: Gateway API failure during initiation
- **WHEN** active payment gateway API returns an error or times out during checkout
- **THEN** system rejects checkout with a bilingual API exception and leaves inventory uncommitted

### Requirement: Unified Payment Callback Handling
The system SHALL provide a unified callback endpoint at `/api/shop/payments/callback` that accepts callback notifications from any supported gateway, normalizes parameters, and verifies transactions.

#### Scenario: Successful TabaPay callback verification
- **WHEN** customer returns from TabaPay with valid token and successful payment status
- **THEN** system verifies payment amount with TabaPay verify API, marks payment as PAID, records reference ID, updates order status to AWAITING_APPROVAL, consumes stock reservations, and deducts variant stock

#### Scenario: Cancelled or failed payment callback
- **WHEN** customer cancels payment at gateway or callback status indicates failure
- **THEN** system marks payment as FAILED without deducting stock, leaving order in PENDING_PAYMENT for retry until reservation expiration

#### Scenario: Idempotent callback processing
- **WHEN** callback endpoint receives duplicate requests for an already verified PAID payment
- **THEN** system returns success with existing tracking code and reference ID without executing secondary stock deductions or status transitions

### Requirement: Gateway Database Integrity
The database SHALL validate and enforce allowed payment gateways using a database check constraint supporting both ZARINPAL and TABAPAY.

#### Scenario: Payment record created with supported gateway
- **WHEN** a payment record is persisted with gateway TABAPAY or ZARINPAL
- **THEN** database accepts and persists the record

#### Scenario: Payment record rejected for unsupported gateway
- **WHEN** a payment record is persisted with an unrecognized gateway identifier
- **THEN** database rejects the insert with a check constraint violation
