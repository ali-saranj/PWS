ALTER TABLE payment DROP CONSTRAINT chk_payment_gateway;
ALTER TABLE payment ADD CONSTRAINT chk_payment_gateway CHECK (gateway IN ('ZARINPAL', 'TABAPAY'));
