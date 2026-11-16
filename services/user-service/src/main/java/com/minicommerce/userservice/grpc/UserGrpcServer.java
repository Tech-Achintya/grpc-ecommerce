
package com.minicommerce.userservice.grpc;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Component
public class UserGrpcServer {

    private final UserGrpcService userGrpcService;

    @Value("${grpc.server.port:50051}")
    private int port;

    private Server server;

    public UserGrpcServer(UserGrpcService userGrpcService) {
        this.userGrpcService = userGrpcService;
    }

    public void start() throws IOException {

        server = ServerBuilder
                .forPort(port)
                .addService(userGrpcService)
                .build()
                .start();

        System.out.println(
                "User gRPC Server started on port " + port
        );
    }

    public void stop() {
        if (server != null) {
            server.shutdown();

            try {
                if (!server.awaitTermination(5, TimeUnit.SECONDS)) {
                    server.shutdownNow();
                }
            } catch (InterruptedException e) {
                server.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }
}
