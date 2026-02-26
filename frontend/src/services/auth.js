import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails
} from 'amazon-cognito-identity-js';

const poolData = {
    UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || ''
};

let userPool = null;
try {
    if (poolData.UserPoolId && poolData.ClientId) {
        userPool = new CognitoUserPool(poolData);
    } else {
        console.warn('Frontend Warning: Cognito variables are missing. Auth features will be disabled.');
    }
} catch (e) {
    console.error('Frontend Error: Failed to initialize Cognito UserPool', e);
}

export const signUp = (email, password, name) => {
    return new Promise((resolve, reject) => {
        if (!userPool) return reject('Cognito not initialized. Check environment variables.');
        const attributeList = [
            { Name: 'email', Value: email },
            { Name: 'name', Value: name }
        ];

        userPool.signUp(email, password, attributeList, null, (err, result) => {
            if (err) reject(err);
            else resolve(result.user);
        });
    });
};

export const signIn = (email, password) => {
    return new Promise((resolve, reject) => {
        if (!userPool) return reject('Cognito not initialized. Check environment variables.');
        const authenticationData = { Username: email, Password: password };
        const authenticationDetails = new AuthenticationDetails(authenticationData);

        const userData = { Username: email, Pool: userPool };
        const cognitoUser = new CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => resolve(result),
            onFailure: (err) => reject(err),
            newPasswordRequired: (userAttributes) => {
                // Handle new password requirement if needed
                reject({ code: 'NewPasswordRequired', userAttributes });
            }
        });
    });
};

export const logout = () => {
    if (!userPool) return;
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
        cognitoUser.signOut();
    }
};

export const getSession = () => {
    return new Promise((resolve, reject) => {
        if (!userPool) return reject('Cognito not initialized');
        const cognitoUser = userPool.getCurrentUser();
        if (!cognitoUser) return reject('No user logged in');

        cognitoUser.getSession((err, session) => {
            if (err) reject(err);
            else resolve(session);
        });
    });
};

export const getUserAttributes = () => {
    return new Promise((resolve, reject) => {
        if (!userPool) return reject('Cognito not initialized');
        const cognitoUser = userPool.getCurrentUser();
        if (!cognitoUser) return reject('No user logged in');

        cognitoUser.getUserAttributes((err, attributes) => {
            if (err) reject(err);
            else {
                const results = {};
                for (let attribute of attributes) {
                    results[attribute.getName()] = attribute.getValue();
                }
                resolve(results);
            }
        });
    });
};
