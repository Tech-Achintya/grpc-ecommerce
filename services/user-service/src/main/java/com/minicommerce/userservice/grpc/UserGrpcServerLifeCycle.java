
package com.minicommerce.userservice.grpc;

import org.springframework.beans.factory.DisposableBean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class UserGrpcServerLifeCycle
        implements CommandLineRunner, DisposableBean {

    private final UserGrpcServer grpcServer;

    public UserGrpcServerLifeCycle(UserGrpcServer grpcServer) {
        this.grpcServer = grpcServer;
    }

    @Override
    public void run(String... args) throws Exception {
        grpcServer.start();
    }

    @Override
    public void destroy() {
        grpcServer.stop();
    }
}
