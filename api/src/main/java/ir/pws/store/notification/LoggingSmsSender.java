package ir.pws.store.notification;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Dev/test sender: logs messages (including tokens) and records them in memory. */
@Component
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "logging", matchIfMissing = true)
public class LoggingSmsSender implements SmsSender {

    public record SentSms(String mobile, SmsTemplate template, List<String> tokens) {}

    private static final Logger log = LoggerFactory.getLogger(LoggingSmsSender.class);

    private final List<SentSms> sent = new CopyOnWriteArrayList<>();
    private volatile boolean fail;

    @Override
    public void send(String mobile, SmsTemplate template, List<String> tokens) {
        if (fail) {
            throw new SmsException("Simulated SMS failure (e.g. out of credit)");
        }
        log.info("SMS (not sent, logging provider) to={} template={} tokens={}", mobile, template, tokens);
        sent.add(new SentSms(mobile, template, List.copyOf(tokens)));
    }

    public List<SentSms> sent() {
        return List.copyOf(sent);
    }

    public void failNext(boolean fail) {
        this.fail = fail;
    }

    public void clear() {
        sent.clear();
        fail = false;
    }
}
