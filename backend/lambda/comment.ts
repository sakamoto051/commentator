import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event: any) => {
  console.log("Event:", JSON.stringify(event));

  const method = event.requestContext.http.method;

  try {
    if (method === "GET") {
      return await handleGet(event);
    } else if (method === "POST") {
      return await handlePost(event);
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

async function handleGet(event: any) {
  const videoId = event.queryStringParameters?.video_id;
  const start = parseInt(event.queryStringParameters?.start || "0");
  const end = parseInt(event.queryStringParameters?.end || "3600000"); // デフォルト1時間

  if (!videoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "video_id is required" }),
    };
  }

  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression:
      "video_id = :v AND playback_time_ms BETWEEN :s AND :e",
    ExpressionAttributeValues: {
      ":v": videoId,
      ":s": start,
      ":e": end,
    },
  });

  const response = await docClient.send(command);
  return {
    statusCode: 200,
    body: JSON.stringify(response.Items),
  };
}

async function handlePost(event: any) {
  const body = JSON.parse(event.body || "{}");
  const { video_id, playback_time_ms, content, user_name } = body;

  if (!video_id || playback_time_ms === undefined || !content) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields" }),
    };
  }

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      video_id,
      playback_time_ms,
      content,
      user_name: user_name || "Anonymous",
      created_at: new Date().toISOString(),
    },
  });

  await docClient.send(command);
  return {
    statusCode: 201,
    body: JSON.stringify({ message: "Comment posted" }),
  };
}
