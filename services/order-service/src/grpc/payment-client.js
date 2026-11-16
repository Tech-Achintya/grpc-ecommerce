const grpc = require("@grpc/grpc-js");
const { PaymentService } = require("./proto-loader");

const paymentClient = new PaymentService(
    "localhost:50052",
    grpc.credentials.createInsecure()
);

module.exports = paymentClient;