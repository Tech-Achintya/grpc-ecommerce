const userClient = require("./user-client");

const savedUserId = "1ca6990d-91a6-4c84-9861-d47f3b81700c";

userClient.getUser(
    { userId: savedUserId },
    (error, response) => {
        if (error) {
            console.error("Get User Error:", error.message);
            console.error("gRPC Status:", error.code);
            return;
        }

        console.log("User Retrieved Successfully!");
        console.log("User ID:", response.userId);
        console.log("Name:", response.name);
    }
);