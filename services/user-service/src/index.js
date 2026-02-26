const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { CognitoIdentityProviderClient, AdminGetUserCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'user-service';

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: SERVICE_NAME, timestamp: new Date().toISOString() });
});

// Get user profile
app.get('/api/users/:username', async (req, res) => {
    try {
        const command = new AdminGetUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: req.params.username,
        });
        const user = await cognito.send(command);

        const attributes = {};
        user.UserAttributes.forEach(attr => {
            attributes[attr.Name] = attr.Value;
        });

        res.json({
            username: user.Username,
            status: user.UserStatus,
            created: user.UserCreateDate,
            modified: user.UserLastModifiedDate,
            attributes,
        });
    } catch (error) {
        if (error.name === 'UserNotFoundException') {
            return res.status(404).json({ error: 'User not found' });
        }
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List users
app.get('/api/users', async (req, res) => {
    try {
        const command = new ListUsersCommand({
            UserPoolId: USER_POOL_ID,
            Limit: parseInt(req.query.limit) || 20,
        });
        const result = await cognito.send(command);

        const users = result.Users.map(user => ({
            username: user.Username,
            status: user.UserStatus,
            created: user.UserCreateDate,
            email: user.Attributes?.find(a => a.Name === 'email')?.Value,
        }));

        res.json({ users, count: users.length });
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Running on port ${PORT}`);
});
