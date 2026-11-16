
const userClient = require("./user-client");

let savedUserId;

function createUser() {
    userClient.createGuestUser(
        { name: "Achintya" },
        (error, response) => {
            if (error) {
                console.error("Create Error:", error);
                return;
            }

            console.log("User Created:", response);

            savedUserId = response.userId;

            getUser(savedUserId);
        }
    );
}

function getUser(userId) {
    userClient.getUser(
        { userId: userId },
        (error, response) => {
            if (error) {
                console.error("Get User Error:", error);
                return;
            }

            console.log("\nUser Retrieved Successfully!");
            console.log("User ID:", response.userId);
            console.log("Name:", response.name);
        }
    );
}

createUser();
