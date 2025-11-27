import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const TABLE_NAME = process.env.WEBSOCKET_TABLE;
const REGION = process.env.REGION;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const cognitoRegion = process.env.COGNITO_REGION || REGION;

const dynamodb = new DynamoDBClient({ region: REGION });

const client = jwksClient({
  jwksUri: `https://cognito-idp.${cognitoRegion}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  // Token enviado en query string: ?token=...
  const token = event.queryStringParameters?.token;
  if (!token) {
    return { statusCode: 401, body: "Unauthorized: token missing" };
  }

  let decoded;
  try {
    decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });
  } catch (err) {
    return { statusCode: 401, body: "Unauthorized: invalid token" };
  }

  const userId = decoded.sub; // ID del usuario en Cognito
  const timestamp = Date.now();
  const expiresAt = Math.floor(timestamp / 1000 + 3600); // TTL 1 hora

  await dynamodb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        connectionId: { S: connectionId },
        userId: { S: userId },
        connectedAt: { N: `${timestamp}` },
        expiresAt: { N: `${expiresAt}` },
      },
    })
  );

  return { statusCode: 200, body: "Connected." };
};
