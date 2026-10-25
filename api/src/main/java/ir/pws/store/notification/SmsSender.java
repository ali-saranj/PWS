package ir.pws.store.notification;

import java.util.List;

public interface SmsSender {

    /** Sends a templated SMS. Throws {@link SmsException} on any failure. */
    void send(String mobile, SmsTemplate template, List<String> tokens);
}
