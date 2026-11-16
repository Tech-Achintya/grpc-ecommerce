import grpc
from concurrent import futures
import uuid

from generated import payment_pb2
from generated import payment_pb2_grpc


class PaymentService(payment_pb2_grpc.PaymentServiceServicer):

    def ProcessPayment(self, request, context):

        print(f"Processing payment for Order: {request.order_id}")
        print(f"Amount: {request.amount_minor_units} {request.currency}")

        if request.amount_minor_units <= 0:
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Payment amount must be greater than zero")
            return payment_pb2.PaymentResponse()

        transaction_id = str(uuid.uuid4())

        return payment_pb2.PaymentResponse(
            transaction_id=transaction_id,
            success=True,
            message="Payment processed successfully"
        )


def serve():

    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10)
    )

    payment_pb2_grpc.add_PaymentServiceServicer_to_server(
        PaymentService(),
        server
    )

    server.add_insecure_port("[::]:50052")
    server.start()

    print("Payment gRPC Server started on port 50052")

    server.wait_for_termination()


if __name__ == "__main__":
    serve()