
import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function addNumbers(a: number, b: number): number {
  return a + b;
}

async function main() {
  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "add_numbers",
        description: "Add two numbers together",
        strict: true,
        parameters: {
          type: "object",
          properties: {
            a: { type: "number" },
            b: { type: "number" },
          },
          required: ["a", "b"],
          additionalProperties: false,
        },
      },
    },
  ];

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: "What is 125 plus 375? Use the add_numbers tool.",
    },
  ];

  // Step 1: Ask the model which tool, if any, it wants to call.
  const firstResponse = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages,
    tools,
    tool_choice: "auto",
  });

  const assistantMessage = firstResponse.choices[0].message;
  messages.push(assistantMessage);

  // Step 2: Execute each tool requested by the model.
  for (const  toolCall of assistantMessage.tool_calls ?? []) {
    if (
      toolCall.type !== "function" ||
      toolCall.function.name !== "add_numbers"
    ) {
      throw new Error("Unsupported tool");
    }

    const args = JSON.parse(toolCall.function.arguments) as {
      a: number;
      b: number;
    };

    // In production, validate parsed arguments at runtime.
    const result = addNumbers(args.a, args.b);

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify({ result }),
    });
  }

  // Step 3: Ask the model to produce the final answer.
  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages,
    tools,
  });

  console.log(finalResponse.choices[0].message.content);
}

main().catch(console.error);
