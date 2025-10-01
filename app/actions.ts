'use server';

interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: Date;
}

export async function sendMessage(message: Message) {
    // Here you can add database logic or other server-side operations
    console.log('Message saved:', message);
    return { success: true };
}