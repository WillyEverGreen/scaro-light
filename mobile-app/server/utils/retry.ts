export async function withRetry<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (retries > 0 && (error.code === 'ECONNRESET' || error.message?.includes('timeout') || error.message?.includes('Connection terminated'))) {
            console.warn(`Database operation failed (${error.code || error.message}). Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(operation, retries - 1, delay * 2);
        }
        throw error;
    }
}
