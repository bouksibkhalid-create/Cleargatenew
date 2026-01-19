/**
 * Error Reporter Utility
 * 
 * Provides centralized error reporting for the application.
 * - Development: Logs to console
 * - Production: Can be extended to send to Sentry or other services
 */

interface ErrorContext {
    component?: string;
    action?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
}

class ErrorReporter {
    private isDev: boolean;

    constructor() {
        this.isDev = import.meta.env.DEV;
    }

    /**
     * Report an error
     */
    report(error: Error, context?: ErrorContext): void {
        const errorData = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            ...context,
        };

        if (this.isDev) {
            // Development: Log to console
            console.error('[ErrorReporter]', errorData);
        } else {
            // Production: Send to error tracking service
            this.sendToService(errorData);
        }
    }

    /**
     * Report a warning
     */
    warn(message: string, context?: ErrorContext): void {
        const warnData = {
            message,
            severity: 'warning',
            timestamp: new Date().toISOString(),
            ...context,
        };

        if (this.isDev) {
            console.warn('[ErrorReporter]', warnData);
        } else {
            this.sendToService(warnData);
        }
    }

    /**
     * Report an API error
     */
    reportApiError(
        endpoint: string,
        statusCode: number,
        message: string,
        context?: ErrorContext
    ): void {
        const apiError = {
            type: 'API_ERROR',
            endpoint,
            statusCode,
            message,
            timestamp: new Date().toISOString(),
            ...context,
        };

        if (this.isDev) {
            console.error('[ErrorReporter] API Error:', apiError);
        } else {
            this.sendToService(apiError);
        }
    }

    /**
     * Send error data to tracking service
     * Extend this method to integrate with Sentry, LogRocket, etc.
     */
    private sendToService(data: Record<string, unknown>): void {
        // TODO: Integrate with Sentry or other error tracking service
        // Example for Sentry:
        // Sentry.captureException(new Error(data.message as string), {
        //   extra: data
        // });

        // For now, log to console in production too
        console.error('[ErrorReporter] Production:', data);
    }
}

// Export singleton instance
export const errorReporter = new ErrorReporter();

// Convenience functions
export function reportError(error: Error, context?: ErrorContext): void {
    errorReporter.report(error, context);
}

export function reportWarning(message: string, context?: ErrorContext): void {
    errorReporter.warn(message, context);
}

export function reportApiError(
    endpoint: string,
    statusCode: number,
    message: string,
    context?: ErrorContext
): void {
    errorReporter.reportApiError(endpoint, statusCode, message, context);
}
