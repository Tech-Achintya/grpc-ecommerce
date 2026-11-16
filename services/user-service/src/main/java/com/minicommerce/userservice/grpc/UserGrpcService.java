package com.minicommerce.userservice.grpc;

import com.minicommerce.contracts.user.*;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserGrpcService extends UserServiceGrpc.UserServiceImplBase {

    private final ConcurrentHashMap<String, UserResponse> users =
            new ConcurrentHashMap<>();

    @Override
    public void createGuestUser(
            CreateGuestUserRequest request,
            StreamObserver<UserResponse> responseObserver) {

        if (request.getName().isBlank()) {
            responseObserver.onError(
                    Status.INVALID_ARGUMENT
                            .withDescription("Name cannot be empty")
                            .asRuntimeException()
            );
            return;
        }

        String userId = UUID.randomUUID().toString();

        UserResponse user = UserResponse.newBuilder()
                .setUserId(userId)
                .setName(request.getName())
                .build();

        users.put(userId, user);

        responseObserver.onNext(user);
        responseObserver.onCompleted();
    }

    @Override
    public void getUser(
            GetUserRequest request,
            StreamObserver<UserResponse> responseObserver) {

        UserResponse user = users.get(request.getUserId());

        if (user == null) {
            responseObserver.onError(
                    Status.NOT_FOUND
                            .withDescription("User not found")
                            .asRuntimeException()
            );
            return;
        }

        responseObserver.onNext(user);
        responseObserver.onCompleted();
    }
}
