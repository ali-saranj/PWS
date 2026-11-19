package ir.pws.store.order;

import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.config.AppProperties;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class PaymentGatewayRegistry {

    private final Map<String, PaymentGateway> gateways;
    private final AppProperties props;

    public PaymentGatewayRegistry(List<PaymentGateway> gatewayList, AppProperties props) {
        this.gateways = gatewayList.stream()
                .collect(Collectors.toMap(gw -> gw.gatewayName().toUpperCase(), Function.identity()));
        this.props = props;
    }

    public PaymentGateway getActiveGateway() {
        String active = props.payment().activeGateway();
        PaymentGateway gateway = gateways.get(active.toUpperCase());
        if (gateway == null) {
            throw new IllegalStateException("Active payment gateway not found: " + active);
        }
        return gateway;
    }

    public PaymentGateway getGateway(String gatewayName) {
        PaymentGateway gateway = gateways.get(gatewayName.toUpperCase());
        if (gateway == null) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
        return gateway;
    }
}
