# `use-trailing-async`

A lightweight React hook for handling async operations with trailing behavior.
It executes the initial async function call immediately and captures any
subsequent calls during execution, automatically running only the most recent
call once the current operation finishes.

## Installation

```bash
npm install use-trailing-async
```

## Usage

```tsx
import useTrailingAsync from 'use-trailing-async';

function ExampleSearchComponent() {
  const { execute, isProcessing, error, result } =
    useTrailingAsync(fetchSearchResults);

  const handleSearch = (query) => {
    execute(query); // Only the latest call will complete if triggered in succession
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {isProcessing && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {result && <div>Results: {JSON.stringify(result)}</div>}
    </div>
  );
}
```

## API

```typescript
function useTrailingAsync<T, A extends unknown[]>(
  asyncFn: (...args: A) => Promise<T>,
): {
  execute: (...args: A) => Promise<T | undefined>;
  isProcessing: boolean;
  error: Error | null;
  result: T | null;
};
```

### Parameters

- `asyncFn`: The async function to execute

### Return Values

- `execute`: Function to trigger the async operation
- `isProcessing`: Boolean indicating if an async operation is in progress
- `error`: Error object if the async operation failed, or `null`
- `result`: The result of the successful async operation, or `null`

## How It Works

When multiple calls to `execute()` happen while an async operation is in
progress:

1. The first call executes immediately
2. Subsequent calls are tracked but not executed right away
3. If multiple pending calls accumulate, only the most recent one will execute
   when the current operation finishes
4. Intermediate calls are skipped entirely

This is particularly useful for:

- Search inputs with rapid typing
- Form submissions with quick multiple clicks
- Any UI interaction where only the latest user intent matters

## License

MIT
