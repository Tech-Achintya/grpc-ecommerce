
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_DIR = path.resolve(__dirname, "../../../../proto");

const options = {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
};

// Load User Service contract
const userDefinition = protoLoader.loadSync(
    path.join(PROTO_DIR, "user.proto"),
    options
);

// Load Payment Service contract
const paymentDefinition = protoLoader.loadSync(
    path.join(PROTO_DIR, "payment.proto"),
    options
);

// Load package definitions
const userProto = grpc.loadPackageDefinition(userDefinition);
const paymentProto = grpc.loadPackageDefinition(paymentDefinition);

module.exports = {
    UserService: userProto.minicommerce.user.v1.UserService,
    PaymentService: paymentProto.minicommerce.payment.v1.PaymentService
};
