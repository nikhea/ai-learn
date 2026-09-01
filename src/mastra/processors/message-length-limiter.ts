// import type { Processor } from "@mastra/core/processors";
// import type { MastraDBMessage } from "@mastra/core/agent/message-list";
// import { TripWire } from "@mastra/core/agent";

// type MessageLengthLimiterOptions = {
//   maxLength?: number;
//   strategy?: "block" | "warn" | "truncate";
// };

// export class MessageLengthLimiter implements Processor {
//   readonly name = "message-length-limiter";
//   private maxLength: number;
//   private strategy: "block" | "warn" | "truncate";

//   constructor(options: MessageLengthLimiterOptions | number = {}) {
//     if (typeof options === "number") {
//       this.maxLength = options;
//       this.strategy = "block";
//     } else {
//       this.maxLength = options.maxLength ?? 1000;
//       this.strategy = options.strategy ?? "block";
//     }
//   }

//   processInput({
//     messages,
//     abort,
//   }: {
//     messages: MastraDBMessage[];
//     abort: (reason?: string) => never;
//   }): MastraDBMessage[] {
//     try {
//       const totalLength = messages.reduce((sum, msg) => {
//         return (
//           sum +
//           msg.content.parts
//             .filter((part) => part.type === "text")
//             .reduce(
//               (partSum, part) =>
//                 partSum + ((part as { text: string }).text?.length || 0),
//               0,
//             )
//         );
//       }, 0);

//       if (totalLength > this.maxLength) {
//         switch (this.strategy) {
//           case "block":
//             abort(
//               `Message too long: ${totalLength} characters (max: ${this.maxLength})`,
//             );
//             break; // Unreachable due to 'never' return type of abort, but good for completeness
//           case "warn":
//             console.warn(
//               `Warning: Message length ${totalLength} exceeds recommended limit of ${this.maxLength} characters`,
//             );
//             break;
//           case "truncate":
//             return this.truncateMessages(messages, this.maxLength);
//         }
//       }
//     } catch (error) {
//       if (error instanceof TripWire) {
//         throw error;
//       }
//       throw new Error(
//         `Length validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
//       );
//     }

//     return messages;
//   }

//   private truncateMessages(
//     messages: MastraDBMessage[],
//     maxLength: number,
//   ): MastraDBMessage[] {
//     const truncatedMessages: MastraDBMessage[] = [];
//     let currentLength = 0;

//     for (const message of messages) {
//       const newParts = [];

//       for (const part of message.content.parts) {
//         if (part.type === "text") {
//           const text = (part as { text: string }).text;
//           const partLength = text.length;

//           // Check if adding this part pushes us over the limit
//           if (currentLength + partLength > maxLength) {
//             const remainingChars = maxLength - currentLength;

//             if (remainingChars > 0) {
//               // Create a new object to avoid mutating the original
//               const newTextPart = { ...part } as { text: string };

//               if (remainingChars > 3) {
//                 // We have space for the ellipsis
//                 newTextPart.text =
//                   text.substring(0, remainingChars - 3) + "...";
//               } else {
//                 // Not enough space for ellipsis, just hard cut
//                 newTextPart.text = text.substring(0, remainingChars);
//               }
//               newParts.push(newTextPart);
//             }

//             currentLength = maxLength;
//             break; // Stop processing further parts for this message
//           }

//           newParts.push(part);
//           currentLength += partLength;
//         } else {
//           // Pass non-text parts (like images) through untouched
//           newParts.push(part);
//         }
//       }

//       truncatedMessages.push({
//         ...message,
//         content: { ...message.content, parts: newParts },
//       });

//       // If we hit the max length, don't include any subsequent messages
//       if (currentLength >= maxLength) {
//         break;
//       }
//     }

//     return truncatedMessages;
//   }
// }
