// Store user data in memory (since localStorage is not available)
let userData = {};

// Function to show all stored users in console
function showStoredUsers() {
    console.log('Stored Users:', userData);
    if (Object.keys(userData).length === 0) {
        console.log('No users registered yet.');
    } else {
        const userList = Object.keys(userData).map(key => {
            const user = userData[key];
            return `${user.firstName} ${user.lastName} (${user.email}) - ${user.accountType}`;
        }).join('\n');
        console.log('Registered Users:\n' + userList);
    }
}