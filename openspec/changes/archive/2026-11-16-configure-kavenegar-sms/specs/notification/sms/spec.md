# Spec Delta

## Purpose

Defines functional requirements and behavioral contracts for dispatching transactional SMS notifications via Kavenegar REST API using verified lookup templates and secure credentials.

## ADDED Requirements

### Requirement: Kavenegar REST Gateway Delivery
The system MUST dispatch transactional SMS messages through Kavenegar Verify Lookup API when the configured provider is `kavenegar`.

#### Scenario: Successful OTP lookup delivery
- **WHEN** a customer or staff requests an authentication OTP and provider is `kavenegar`
- **THEN** system dispatches an HTTP request to `/v1/{apiKey}/verify/lookup.json` with receptor mobile, code token, and the configured OTP template name

### Requirement: Configurable Template Resolution
The system MUST resolve template names for OTP, order paid, order approved, and order shipped from environment configuration, supporting approved identifiers such as `SMS`.

#### Scenario: Custom OTP template name
- **WHEN** `APP_SMS_KAVENEGAR_TEMPLATE_OTP` is configured with template name `SMS`
- **THEN** outbound OTP lookup requests use query parameter `template=SMS`

### Requirement: Telecommunication Provider Failure Handling
The system MUST handle non-200 HTTP responses, provider error codes, and network timeouts by raising an exception without leaking API credentials into logs or error payloads.

#### Scenario: Gateway returns error status
- **WHEN** Kavenegar returns a non-200 HTTP status or a return status other than 200
- **THEN** system marks notification delivery failed and translates it to `SMS_UNAVAILABLE` without exposing the API key

### Requirement: Development and Test Logging Provider Isolation
The system MUST support a `logging` provider mode that records SMS payloads locally without contacting external telecommunication services.

#### Scenario: Local development execution
- **WHEN** `app.sms.provider` is set to `logging` or omitted in default profile
- **THEN** system logs the message details locally without issuing external HTTP requests
