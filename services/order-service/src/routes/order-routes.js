const express = require("express");
const router = express.Router();

const userClient = require("../grpc/user-client");
const paymentClient = require("../grpc/payment-client");

router.post("/", (req, res) => {
    const { name, amountMinorUnits, currency } = req.body;

    if (!name || !amountMinorUnits || !currency) {
        return res.status(400).json({
            success: false,
            message: "name, amountMinorUnits and currency are required"
        });
    }

    // Step 1: Create user through Java gRPC service
    userClient.createGuestUser(
        { name },
        (userError, userResponse) => {

            if (userError) {
                return res.status(502).json({
                    success: false,
                    message: "User service failed",
                    error: userError.message
                });
            }

            const orderId = `ORD-${Date.now()}`;

            // Step 2: Process payment through Python gRPC service
            paymentClient.processPayment(
                {
                    orderId,
                    amountMinorUnits: String(amountMinorUnits),
                    currency
                },
                (paymentError, paymentResponse) => {

                    if (paymentError) {
                        return res.status(502).json({
                            success: false,
                            message: "Payment service failed",
                            user: userResponse,
                            error: paymentError.message
                        });
                    }

                    // Step 3: Return combined response
                    return res.status(201).json({
                        success: true,
                        message: "Order processed successfully",
                        order: {
                            orderId,
                            user: userResponse,
                            payment: paymentResponse
                        }
                    });
                }
            );
        }
    );
});

module.exports = router;