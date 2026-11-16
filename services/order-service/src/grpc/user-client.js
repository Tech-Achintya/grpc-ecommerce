
const grpc = require("@grpc/grpc-js");

const { UserService } = require("./proto-loader");

// Create gRPC client
const userClient = new UserService(
    "localhost:50051",
    grpc.credentials.createInsecure()
);

module.exports = userClient;
