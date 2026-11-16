# MiniCommerce — gRPC Notes

Architecture recap:

```
React (5173) --REST--> Express Order Service (3000)
                            |--gRPC--> Java User Service (50051)
                            |--gRPC--> Python Payment Service (50052)

Flask app.py (5000) is only a health endpoint; payment traffic uses gRPC.
```

---

## 1. The `.proto` Contract

Two shared files: `proto/user.proto` and `proto/payment.proto`.

Think of a `.proto` as a **communication contract** between different services.

### user.proto

```proto
service UserService {
    rpc CreateGuestUser(CreateGuestUserRequest)
        returns (UserResponse);

    rpc GetUser(GetUserRequest)
        returns (UserResponse);
}
```

`rpc` means **Remote Procedure Call** — one application invokes an operation implemented by another application as if it were a remote method.

```js
userClient.createGuestUser(request, callback);
```

This is not a local JavaScript function executing business logic. It sends an RPC request to the remote Java server.

### Messages

```proto
message CreateGuestUserRequest {
    string name = 1;
}
```

This defines the structure of a request. Conceptually it resembles a Java class:

```java
public class CreateGuestUserRequest {
    private String name;
}
```

```proto
string user_id = 1;
string name = 2;
```

`1`, `2` are **field numbers**, not values. Protobuf uses field numbers when encoding/decoding messages.

### What happens after creating a `.proto` file?

The `.proto` file itself does not implement business logic. It only defines the contract.

You then use the Protobuf compiler (`protoc`) plus language-specific gRPC plugins to generate code.

---

## 2. Code Generation Per Language

### Java

Maven is configured with:

1. `protobuf-maven-plugin`
2. `protoc`
3. `protoc-gen-grpc-java`

The plugin reads the shared proto directory (`${project.basedir}/../../proto`) and generates:

```
user-service/
└── target/
    └── generated-sources/
        └── protobuf/
            ├── java/
            │   ├── UserResponse.java
            │   ├── CreateGuestUserRequest.java
            │   └── GetUserRequest.java
            │
            └── grpc-java/
                ├── UserServiceGrpc.java
                └── PaymentServiceGrpc.java
```

Two important categories:

1. **Message classes** — `UserResponse`, `CreateGuestUserRequest`, `GetUserRequest`, generated from the `message` definitions.
2. **Service classes** — `UserServiceGrpc.java`, generated from the `service UserService { rpc ... }` definition.

Because the shared proto folder contains both files, Maven generates Java classes for both `user.proto` and `payment.proto`.

### Python

```
payment-service/
└── generated/
    ├── __init__.py
    ├── payment_pb2.py
    └── payment_pb2_grpc.py
```

- `payment_pb2.py` — Protobuf message classes and serialization.
- `payment_pb2_grpc.py` — gRPC client stub, server base class, and registration function.

Generated with `grpcio-tools` (the `protoc` Python plugin).

### Node.js — why no generated files?

`@grpc/proto-loader` loads the `.proto` at runtime instead of generating code:

```js
const protoLoader = require("@grpc/proto-loader");

const packageDefinition = protoLoader.loadSync("payment.proto", options);
const paymentProto = grpc.loadPackageDefinition(packageDefinition);
```

The proto file is parsed when the process starts, so nothing is written to disk.

---

## 3. Java User Service

```
user-service/src/main/java/com/minicommerce/userservice/grpc/
├── UserGrpcService.java
├── UserGrpcServer.java
└── UserGrpcServerLifeCycle.java
```

### `UserGrpcService.java`

Contains the actual business logic.

```java
public class UserGrpcService
        extends UserServiceGrpc.UserServiceImplBase {
```

This inheritance is critical: it says "I want to implement the RPC operations declared in the `UserService` contract."

```java
@Override
public void createGuestUser(
    CreateGuestUserRequest request,
    StreamObserver<UserResponse> responseObserver
)
```

This implements the `CreateGuestUser` RPC.

- The Java method name is camel-cased automatically from the Protobuf RPC name.
- The request arrives as a generated Protobuf object, so you read `request.getName()`.
- Unary RPC, but Java's generated API uses `StreamObserver` to send the single response.

Create and store the user:

```java
String userId = UUID.randomUUID().toString();
UserResponse user = UserResponse.newBuilder()
        .setUserId(userId)
        .setName(request.getName())
        .build();
users.put(userId, user);
```

Return it:

```java
responseObserver.onNext(user);
responseObserver.onCompleted();
```

- `onNext()` sends the response message.
- `onCompleted()` tells gRPC the RPC response has finished.

Return an error instead of a response:

```java
responseObserver.onError(
    Status.NOT_FOUND
        .withDescription("User not found")
        .asRuntimeException()
);
```

### `UserGrpcServer.java`

Builds and starts the gRPC server:

```java
server = ServerBuilder
        .forPort(port)          // 50051
        .addService(userGrpcService)
        .build()
        .start();
```

`addService(...)` registers the implementation, which is why clients can invoke the RPCs.

### `UserGrpcServerLifeCycle.java`

Spring Boot manages the gRPC server lifecycle.

```java
implements CommandLineRunner, DisposableBean
```

- `CommandLineRunner` → when Spring finishes starting the application context, run `run()`, which starts the gRPC server.
- `DisposableBean` → provides `destroy()`, used to shut the gRPC server down when Spring shuts down.

So two separate servers run inside the same Java application:

- Spring MVC / Tomcat HTTP server on **8081**
- Manually created gRPC server on **50051**

Communication between services primarily uses the gRPC server (50051).

---

## 4. Python Payment Service

```
payment-service/
├── app.py            # Flask health endpoint (port 5000)
├── grpc_server.py    # gRPC server (port 50052)
└── generated/
    ├── payment_pb2.py
    └── payment_pb2_grpc.py
```

### `grpc_server.py`

```python
class PaymentService(payment_pb2_grpc.PaymentServiceServicer):
```

Again, inheritance from a generated base class: you are implementing the contract declared in `payment.proto`.

```python
def ProcessPayment(self, request, context):
```

This implements:

```proto
rpc ProcessPayment(PaymentRequest) returns (PaymentResponse);
```

The request object contains the deserialized Protobuf request:

```python
request.order_id
request.amount_minor_units
request.currency
```

Return:

```python
return payment_pb2.PaymentResponse(
    transaction_id=transaction_id,
    success=True,
    message="Payment processed successfully"
)
```

The Python gRPC framework serializes this response and sends it to the client.

Register the service:

```python
payment_pb2_grpc.add_PaymentServiceServicer_to_server(
    PaymentService(),
    server
)
```

This is the Python equivalent of Java's `.addService(userGrpcService)`.

Start and block:

```python
server.start()
server.wait_for_termination()
```

The server listens and stays alive until terminated.

### `app.py` (Flask)

Only exposes `GET /health` on port 5000. Actual payment processing happens through the gRPC server, not Flask.

---

## 5. Node.js Order Service

This is the orchestrator: it coordinates the other two services.

```
order-service/src/
├── grpc/
│   ├── proto-loader.js
│   ├── user-client.js
│   ├── payment-client.js
│   ├── test-user-client.js
│   └── test-payment-client.js
│
├── routes/
│   └── order-routes.js
│
└── server.js
```

### `proto-loader.js`

The bridge between the `.proto` contracts and Node.js.

```js
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
```

Load both contracts:

```js
const userDefinition = protoLoader.loadSync(
    path.join(PROTO_DIR, "user.proto"),
    options
);
const paymentDefinition = protoLoader.loadSync(
    path.join(PROTO_DIR, "payment.proto"),
    options
);
```

```js
const userProto = grpc.loadPackageDefinition(userDefinition);
const paymentProto = grpc.loadPackageDefinition(paymentDefinition);
```

This creates a JavaScript representation of the Protobuf package.

```js
module.exports = {
    UserService: userProto.minicommerce.user.v1.UserService,
    PaymentService: paymentProto.minicommerce.payment.v1.PaymentService
};
```

The loader uses `keepCase: false`, so `user_id` / `order_id` in proto become `userId` / `orderId` in JavaScript. That is why Node sends `orderId` while Python reads `request.order_id`.

### `user-client.js`

```js
const userClient = new UserService(
    "localhost:50051",
    grpc.credentials.createInsecure()
);
```

This creates a gRPC **client stub** for Java's User Service.

A stub is a client-side proxy exposing the remote service's methods:

```js
userClient.createGuestUser(...)
userClient.getUser(...)
```

The stub handles low-level gRPC communication. You don't manually build HTTP/2 frames or serialize Protobuf messages.

### `payment-client.js`

Almost identical:

```js
const paymentClient = new PaymentService(
    "localhost:50052",
    grpc.credentials.createInsecure()
);
```

It exposes:

```js
paymentClient.processPayment(...)
```

### Test clients

- `test-user-client.js` — creates a guest user, then calls `getUser` with the returned ID.
- `test-payment-client.js` — calls `processPayment` with a fixed request and logs the response.

### `order-routes.js`

The orchestration logic. Registered as:

```js
router.post("/", (req, res) => {
```

The frontend sends:

```json
{
  "name": "Achintya",
  "amountMinorUnits": 49900,
  "currency": "INR"
}
```

Call the Java RPC:

```js
userClient.createGuestUser(
    { name },
    (userError, userResponse) => {
        // ...
    }
);
```

Once Java returns the user, create an order ID:

```js
const orderId = `ORD-${Date.now()}`;
```

Then call the Python RPC:

```js
paymentClient.processPayment(
    {
        orderId,
        amountMinorUnits: String(amountMinorUnits),
        currency
    },
    (paymentError, paymentResponse) => {
        // ...
    }
);
```

Finally, combine the responses:

```js
res.status(201).json({
    success: true,
    message: "Order processed successfully",
    order: {
        orderId,
        user: userResponse,
        payment: paymentResponse
    }
});
```

---

## 6. What Actually Happens When You Click "Create Order"?

Request:

```json
{
  "name": "Achintya",
  "amountMinorUnits": 49900,
  "currency": "INR"
}
```

### Step 1 — React sends an HTTP request

```js
fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
});
```

A normal REST call: the browser sends JSON to Express.

The UI takes the amount in rupees and sends minor units:

```js
amountMinorUnits: Math.round(Number(amount) * 100)
```

### Step 2 — Express invokes Java using gRPC

```js
userClient.createGuestUser({ name: "Achintya" }, callback);
```

Internally:

1. Node's gRPC client receives the JavaScript request object.
2. The gRPC library converts it into Protobuf wire format.
3. It sends the encoded message over HTTP/2 to `localhost:50051`.
4. The Java gRPC server decodes it into `CreateGuestUserRequest`.
5. The registered `UserGrpcService.createGuestUser()` executes.
6. Java creates a UUID and constructs a `UserResponse`.
7. The response is serialized to Protobuf and sent back over HTTP/2.
8. Node decodes it and invokes the callback with `userResponse`.

### Step 3 — Express invokes Python using gRPC

Now Node has the user ID. It creates an order ID and calls:

```js
paymentClient.processPayment(
    {
        orderId,
        amountMinorUnits: "49900",
        currency: "INR"
    },
    callback
);
```

Same process, but:

- Destination: port **50052**
- Server: **Python**
- Method: `ProcessPayment`
- Request: `PaymentRequest`
- Response: `PaymentResponse`

Python generates a transaction ID and returns a successful payment response.

### Step 4 — Express returns the combined response

```json
{
  "success": true,
  "message": "Order processed successfully",
  "order": {
    "orderId": "ORD-123",
    "user": {
      "userId": "abc-123",
      "name": "Achintya"
    },
    "payment": {
      "transactionId": "xyz-456",
      "success": true,
      "message": "Payment processed successfully"
    }
  }
}
```

React renders the order confirmation from this JSON.
