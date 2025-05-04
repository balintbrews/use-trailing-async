import { useCallback, useRef, useState } from 'react';

function useTrailingAsync<T, A extends unknown[]>(
  asyncFn: (...args: A) => Promise<T>,
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<T | null>(null);

  const latestArgsRef = useRef<A | null>(null);
  const isProcessingRef = useRef(false);
  const needsReprocessRef = useRef(false);

  const execute = useCallback(
    async (...args: A) => {
      // Save latest args.
      latestArgsRef.current = args;

      // If already processing, mark as needing reprocess, then return.
      if (isProcessingRef.current) {
        needsReprocessRef.current = true;
        return;
      }

      // Start processing.
      setIsProcessing(true);
      isProcessingRef.current = true;
      setError(null);

      try {
        let processingResult;
        do {
          // Reset the reprocess flag.
          needsReprocessRef.current = false;
          // Process the args.
          processingResult = await asyncFn(...latestArgsRef.current);
          // The reprocess flag may be set true again while processing.
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } while (needsReprocessRef.current);

        setResult(processingResult);
        return processingResult;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [asyncFn],
  );

  return { execute, isProcessing, error, result };
}

export default useTrailingAsync;
