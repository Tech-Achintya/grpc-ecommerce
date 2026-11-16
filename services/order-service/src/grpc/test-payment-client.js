const paymentClient = require("./payment-client");

const request = {
    orderId: "ORDER-1001",
    amountMinorUnits: "49900",
    currency: "INR"
};

paymentClient.processPayment(request, (error, response) => {
    if (error) {
        console.error("Payment gRPC Error:", error);
        return;
    }

    console.log("Payment Response:");
    console.log("Transaction ID:", response.transactionId);
    console.log("Success:", response.success);
    console.log("Message:", response.message);
});